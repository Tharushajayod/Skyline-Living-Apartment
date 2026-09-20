package com.skyline.service;

import com.skyline.dto.reservation.ReservationRequest;
import com.skyline.dto.reservation.ReservationResponse;
import com.skyline.dto.reservation.ReservationStatusUpdate;
import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Reservation;
import com.skyline.entity.User;
import com.skyline.enums.AppointmentStatus;
import com.skyline.enums.NotificationType;
import com.skyline.enums.ReservationStatus;
import com.skyline.enums.UserRole;
import com.skyline.exception.BadRequestException;
import com.skyline.exception.ConflictException;
import com.skyline.exception.ForbiddenException;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.AppointmentRepository;
import com.skyline.repository.ReservationRepository;
import com.skyline.security.UserPrincipal;
import com.skyline.util.IdParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ApartmentRepository apartmentRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public ReservationService(ReservationRepository reservationRepository,
                              ApartmentRepository apartmentRepository,
                              AppointmentRepository appointmentRepository,
                              UserService userService,
                              NotificationService notificationService) {
        this.reservationRepository = reservationRepository;
        this.apartmentRepository = apartmentRepository;
        this.appointmentRepository = appointmentRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    public List<ReservationResponse> getReservations(UserPrincipal principal, String customerParam) {
        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        if (isStaffOrAdmin) {
            if (customerParam != null && !customerParam.trim().isEmpty()) {
                return reservationRepository.findByCustomerEmailOrderByCreatedAtDesc(customerParam.trim()).stream()
                        .map(ReservationResponse::fromEntity)
                        .collect(Collectors.toList());
            }
            return reservationRepository.findAll().stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .map(ReservationResponse::fromEntity)
                    .collect(Collectors.toList());
        }

        Long customerId = principal != null ? principal.getId() : null;
        if (customerId == null && customerParam != null) {
            return reservationRepository.findByCustomerEmailOrderByCreatedAtDesc(customerParam.trim()).stream()
                    .map(ReservationResponse::fromEntity)
                    .collect(Collectors.toList());
        }
        if (customerId != null) {
            return reservationRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                    .map(ReservationResponse::fromEntity)
                    .collect(Collectors.toList());
        }
        return List.of();
    }

    public ReservationResponse getReservationById(Long id) {
        return reservationRepository.findById(id)
                .map(ReservationResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
    }

    public Reservation getReservationEntityById(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
    }

    @Transactional
    public ReservationResponse createReservation(UserPrincipal principal, ReservationRequest request) {
        Long aptId = IdParser.parseId(request.getApartmentId());
        Apartment apartment = apartmentRepository.findById(aptId)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + aptId));

        User customer;
        if (principal != null) {
            customer = principal.getUser();
        } else if (request.getCustomerEmail() != null) {
            customer = userService.getUserEntityByEmail(request.getCustomerEmail());
        } else {
            throw new BadRequestException("Customer authentication or email required");
        }

        // Rule 1: Customer must have approved or completed viewing
        boolean hasEligibleViewing = appointmentRepository.existsByApartmentIdAndCustomerIdAndStatusIn(
                apartment.getId(),
                customer.getId(),
                Arrays.asList(AppointmentStatus.APPROVED, AppointmentStatus.COMPLETED)
        );

        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        if (!hasEligibleViewing && !isStaffOrAdmin) {
            throw new BadRequestException("A completed or approved viewing appointment is required before placing a reservation.");
        }

        // Rule 2: Apartment must be AVAILABLE
        if (apartment.getStatus() != ApartmentStatus.AVAILABLE) {
            throw new ConflictException("Apartment is not available for reservation (Current status: " + apartment.getStatus().getDisplayValue() + ")");
        }

        // Rule 3: Prevent duplicate active reservations
        boolean hasActive = reservationRepository.existsByApartmentIdAndStatusIn(
                apartment.getId(),
                Arrays.asList(ReservationStatus.PENDING, ReservationStatus.CONFIRMED)
        );
        if (hasActive) {
            throw new ConflictException("Apartment already has an active reservation.");
        }

        // Reservation fee = 10% of apartment price
        BigDecimal fee = apartment.getPrice()
                .multiply(new BigDecimal("0.10"))
                .setScale(2, java.math.RoundingMode.HALF_UP);

        Reservation reservation = Reservation.builder()
                .apartment(apartment)
                .customer(customer)
                .customerName(request.getCustomerName() != null ? request.getCustomerName() : customer.getName())
                .customerEmail(request.getCustomerEmail() != null ? request.getCustomerEmail() : customer.getEmail())
                .reservationFee(fee)
                .status(ReservationStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusDays(4))
                .createdAt(LocalDateTime.now())
                .build();

        // Rule 4: Apartment becomes RESERVED
        apartment.setStatus(ApartmentStatus.RESERVED);
        apartmentRepository.save(apartment);

        Reservation saved = reservationRepository.save(reservation);

        // Notify customer
        notificationService.createNotification(
                customer,
                NotificationType.RESERVATION,
                "Reservation Placed - Payment Required",
                "Your reservation for " + apartment.getTitle()
                        + " has been placed. The reservation fee is 10% of the apartment price ("
                        + fee
                        + "). Please upload the reservation fee payment proof within 96 hours to confirm."
        );

        return ReservationResponse.fromEntity(saved);
    }

    @Transactional
    public ReservationResponse updateStatus(Long id, ReservationStatusUpdate update, UserPrincipal principal) {
        Reservation reservation = getReservationEntityById(id);
        ReservationStatus newStatus = update.getStatus();

        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        if (!isStaffOrAdmin) {
            if (!reservation.getCustomer().getId().equals(principal.getId())) {
                throw new ForbiddenException("You cannot modify another customer's reservation");
            }
            if (newStatus != ReservationStatus.CANCELLED) {
                throw new ForbiddenException("Customers may only cancel reservations");
            }
        }

        reservation.setStatus(newStatus);
        Reservation saved = reservationRepository.save(reservation);

        // If cancelled or expired, release apartment if no other active reservation
        if (newStatus == ReservationStatus.CANCELLED || newStatus == ReservationStatus.EXPIRED) {
            Apartment apt = reservation.getApartment();
            boolean stillHasActive = reservationRepository.existsByApartmentIdAndStatusIn(
                    apt.getId(),
                    Arrays.asList(ReservationStatus.PENDING, ReservationStatus.CONFIRMED)
            );
            if (!stillHasActive && apt.getStatus() == ApartmentStatus.RESERVED) {
                apt.setStatus(ApartmentStatus.AVAILABLE);
                apartmentRepository.save(apt);
            }
        }

        // Notify customer
        String msg = switch (newStatus) {
            case CONFIRMED -> "Your reservation for " + reservation.getApartment().getTitle() + " is now CONFIRMED.";
            case CANCELLED -> "Your reservation for " + reservation.getApartment().getTitle() + " has been cancelled.";
            case EXPIRED -> "Your reservation for " + reservation.getApartment().getTitle() + " has expired.";
            default -> "Reservation status updated: " + newStatus.getDisplayValue();
        };

        notificationService.createNotification(
                reservation.getCustomer(),
                NotificationType.RESERVATION,
                "Reservation Status: " + newStatus.getDisplayValue(),
                msg
        );

        return ReservationResponse.fromEntity(saved);
    }

    @Transactional
    public void expireOverdueReservations() {
        List<Reservation> overdue = reservationRepository.findByStatusAndExpiresAtBefore(
                ReservationStatus.PENDING, LocalDateTime.now());

        for (Reservation r : overdue) {
            r.setStatus(ReservationStatus.EXPIRED);
            reservationRepository.save(r);

            Apartment apt = r.getApartment();
            if (apt.getStatus() == ApartmentStatus.RESERVED) {
                boolean hasOtherActive = reservationRepository.existsByApartmentIdAndStatusIn(
                        apt.getId(),
                        Arrays.asList(ReservationStatus.PENDING, ReservationStatus.CONFIRMED)
                );
                if (!hasOtherActive) {
                    apt.setStatus(ApartmentStatus.AVAILABLE);
                    apartmentRepository.save(apt);
                }
            }

            notificationService.createNotification(
                    r.getCustomer(),
                    NotificationType.RESERVATION,
                    "Reservation Expired",
                    "Your reservation for " + apt.getTitle() + " has expired because payment proof was not verified within 48 hours."
            );
        }
    }
}
