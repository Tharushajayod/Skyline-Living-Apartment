package com.skyline.service;

import com.skyline.dto.appointment.AppointmentRequest;
import com.skyline.dto.appointment.AppointmentResponse;
import com.skyline.dto.appointment.AppointmentStatusUpdate;
import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Appointment;
import com.skyline.entity.User;
import com.skyline.enums.AppointmentStatus;
import com.skyline.enums.NotificationType;
import com.skyline.enums.UserRole;
import com.skyline.exception.BadRequestException;
import com.skyline.exception.ForbiddenException;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.AppointmentRepository;
import com.skyline.security.UserPrincipal;
import com.skyline.util.IdParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ApartmentService apartmentService;
    private final UserService userService;
    private final NotificationService notificationService;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              ApartmentService apartmentService,
                              UserService userService,
                              NotificationService notificationService) {
        this.appointmentRepository = appointmentRepository;
        this.apartmentService = apartmentService;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    public List<AppointmentResponse> getAppointments(UserPrincipal principal, String customerParam) {
        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        if (isStaffOrAdmin) {
            if (customerParam != null && !customerParam.trim().isEmpty()) {
                return appointmentRepository.findByCustomerEmailOrderByDateDesc(customerParam.trim()).stream()
                        .map(AppointmentResponse::fromEntity)
                        .collect(Collectors.toList());
            }
            return appointmentRepository.findAll().stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .map(AppointmentResponse::fromEntity)
                    .collect(Collectors.toList());
        }

        // Customer sees only own appointments
        Long customerId = principal != null ? principal.getId() : null;
        if (customerId == null && customerParam != null) {
            return appointmentRepository.findByCustomerEmailOrderByDateDesc(customerParam.trim()).stream()
                    .map(AppointmentResponse::fromEntity)
                    .collect(Collectors.toList());
        }
        if (customerId != null) {
            return appointmentRepository.findByCustomerIdOrderByDateDesc(customerId).stream()
                    .map(AppointmentResponse::fromEntity)
                    .collect(Collectors.toList());
        }
        return List.of();
    }

    @Transactional
    public AppointmentResponse createAppointment(UserPrincipal principal, AppointmentRequest request) {
        Long aptId = IdParser.parseId(request.getApartmentId());
        Apartment apartment = apartmentService.getApartmentEntityById(aptId);

        if (apartment.getStatus() == ApartmentStatus.SOLD) {
            throw new BadRequestException("Cannot book viewing for a sold apartment");
        }

        User customer;
        if (principal != null) {
            customer = principal.getUser();
        } else if (request.getCustomerEmail() != null) {
            customer = userService.getUserEntityByEmail(request.getCustomerEmail());
        } else {
            throw new BadRequestException("Authenticated customer or customer email is required");
        }

        LocalDate viewingDate;
        try {
            viewingDate = LocalDate.parse(request.getDate());
        } catch (Exception e) {
            throw new BadRequestException("Invalid date format. Expected YYYY-MM-DD");
        }

        if (viewingDate.isBefore(LocalDate.now())) {
            throw new BadRequestException("Viewing date cannot be in the past");
        }

        String name = request.getCustomerName() != null && !request.getCustomerName().isEmpty()
                ? request.getCustomerName() : customer.getName();
        String email = request.getCustomerEmail() != null && !request.getCustomerEmail().isEmpty()
                ? request.getCustomerEmail() : customer.getEmail();
        String phone = request.getCustomerPhone() != null && !request.getCustomerPhone().isEmpty()
                ? request.getCustomerPhone() : customer.getPhone();

        Appointment appointment = Appointment.builder()
                .apartment(apartment)
                .customer(customer)
                .customerName(name)
                .customerEmail(email)
                .customerPhone(phone)
                .date(viewingDate)
                .timeSlot(request.getTimeSlot())
                .status(AppointmentStatus.PENDING)
                .notes(request.getNotes() != null ? request.getNotes() : "")
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        // Notify customer
        notificationService.createNotification(
                customer,
                NotificationType.APPOINTMENT,
                "Viewing Appointment Requested",
                "Your viewing request for " + apartment.getTitle() + " on " + viewingDate + " (" + request.getTimeSlot() + ") has been submitted."
        );

        return AppointmentResponse.fromEntity(saved);
    }

    @Transactional
    public AppointmentResponse updateStatus(Long id, AppointmentStatusUpdate update, UserPrincipal principal) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        AppointmentStatus newStatus = update.getStatus();

        if (!isStaffOrAdmin) {
            // Customer can only cancel their own appointment
            if (!appointment.getCustomer().getId().equals(principal.getId())) {
                throw new ForbiddenException("You cannot modify another customer's appointment");
            }
            if (newStatus != AppointmentStatus.CANCELLED) {
                throw new ForbiddenException("Customers may only cancel appointments");
            }
            if (appointment.getStatus() != AppointmentStatus.PENDING &&
                appointment.getStatus() != AppointmentStatus.APPROVED &&
                appointment.getStatus() != AppointmentStatus.RESCHEDULED) {
                throw new BadRequestException("This appointment cannot be cancelled");
            }
        }

        if (newStatus == AppointmentStatus.RESCHEDULED) {
            if (update.getDate() != null && !update.getDate().isEmpty()) {
                appointment.setDate(LocalDate.parse(update.getDate()));
            }
            if (update.getTimeSlot() != null && !update.getTimeSlot().isEmpty()) {
                appointment.setTimeSlot(update.getTimeSlot());
            }
        }

        appointment.setStatus(newStatus);
        Appointment saved = appointmentRepository.save(appointment);

        // Notify customer on status change
        String notifMsg = switch (newStatus) {
            case APPROVED -> "Your viewing for " + appointment.getApartment().getTitle() + " has been approved for " + appointment.getDate() + " (" + appointment.getTimeSlot() + ").";
            case REJECTED -> "Your viewing request for " + appointment.getApartment().getTitle() + " could not be approved.";
            case RESCHEDULED -> "Your viewing for " + appointment.getApartment().getTitle() + " has been rescheduled to " + appointment.getDate() + " (" + appointment.getTimeSlot() + ").";
            case COMPLETED -> "Viewing completed! You are now eligible to place a reservation on " + appointment.getApartment().getTitle() + ".";
            case CANCELLED -> "Your viewing appointment for " + appointment.getApartment().getTitle() + " has been cancelled.";
            default -> "Your viewing appointment status is now: " + newStatus.getDisplayValue();
        };

        notificationService.createNotification(
                appointment.getCustomer(),
                NotificationType.APPOINTMENT,
                "Viewing Status Updated: " + newStatus.getDisplayValue(),
                notifMsg
        );

        return AppointmentResponse.fromEntity(saved);
    }
}
