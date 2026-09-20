package com.skyline.service;

import com.skyline.dto.sale.SaleRequest;
import com.skyline.dto.sale.SaleResponse;
import com.skyline.entity.*;
import com.skyline.enums.NotificationType;
import com.skyline.enums.ReservationStatus;
import com.skyline.exception.BadRequestException;
import com.skyline.exception.ConflictException;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.OwnershipRecordRepository;
import com.skyline.repository.ReservationRepository;
import com.skyline.repository.SaleRepository;
import com.skyline.security.UserPrincipal;
import com.skyline.util.IdParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final OwnershipRecordRepository ownershipRecordRepository;
    private final ApartmentRepository apartmentRepository;
    private final ReservationRepository reservationRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public SaleService(SaleRepository saleRepository,
                       OwnershipRecordRepository ownershipRecordRepository,
                       ApartmentRepository apartmentRepository,
                       ReservationRepository reservationRepository,
                       UserService userService,
                       NotificationService notificationService) {
        this.saleRepository = saleRepository;
        this.ownershipRecordRepository = ownershipRecordRepository;
        this.apartmentRepository = apartmentRepository;
        this.reservationRepository = reservationRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    public List<SaleResponse> getAllSales() {
        return saleRepository.findAll().stream()
                .sorted((a, b) -> b.getSaleDate().compareTo(a.getSaleDate()))
                .map(SaleResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public SaleResponse getSaleById(Long id) {
        return saleRepository.findById(id)
                .map(SaleResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with id: " + id));
    }

    @Transactional
    public SaleResponse finalizeSale(UserPrincipal principal, SaleRequest request) {
        Apartment apartment = null;
        Reservation reservation = null;
        User customer = null;

        if (request.getReservationId() != null && !request.getReservationId().trim().isEmpty()) {
            Long rsvId = IdParser.parseId(request.getReservationId());
            reservation = reservationRepository.findById(rsvId)
                    .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + rsvId));
            apartment = reservation.getApartment();
            customer = reservation.getCustomer();
        } else if (request.getApartmentId() != null && !request.getApartmentId().trim().isEmpty()) {
            Long aptId = IdParser.parseId(request.getApartmentId());
            apartment = apartmentRepository.findById(aptId)
                    .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + aptId));
        }

        if (apartment == null) {
            throw new BadRequestException("Apartment or Reservation ID is required to finalize sale");
        }

        if (customer == null) {
            if (request.getCustomerEmail() != null) {
                customer = userService.getUserEntityByEmail(request.getCustomerEmail());
            } else {
                throw new BadRequestException("Customer information is required for sale");
            }
        }

        if (apartment.getStatus() == ApartmentStatus.SOLD) {
            throw new ConflictException("Apartment is already sold");
        }

        LocalDate saleDate = LocalDate.now();
        if (request.getSaleDate() != null && !request.getSaleDate().trim().isEmpty()) {
            try {
                saleDate = LocalDate.parse(request.getSaleDate().trim());
            } catch (Exception ignored) {}
        }

        User staff = principal != null ? principal.getUser() : userService.getUserEntityByEmail("staff@skylineliving.com");

        // 1. Mark apartment as SOLD
        apartment.setStatus(ApartmentStatus.SOLD);
        apartmentRepository.save(apartment);

        // 2. Mark reservation confirmed
        if (reservation != null) {
            reservation.setStatus(ReservationStatus.CONFIRMED);
            reservationRepository.save(reservation);
        }

        // 3. Create Sale record
        Sale sale = Sale.builder()
                .apartment(apartment)
                .customer(customer)
                .customerName(request.getCustomerName() != null ? request.getCustomerName() : customer.getName())
                .customerEmail(customer.getEmail())
                .apartmentTitle(apartment.getTitle())
                .finalPrice(request.getFinalPrice())
                .reservation(reservation)
                .saleDate(saleDate)
                .staff(staff)
                .staffName(staff != null ? staff.getName() : "Staff Member")
                .createdAt(LocalDateTime.now())
                .build();

        Sale savedSale = saleRepository.save(sale);

        // 4. Create Ownership Record
        OwnershipRecord ownershipRecord = OwnershipRecord.builder()
                .apartment(apartment)
                .customer(customer)
                .sale(savedSale)
                .ownershipDate(saleDate)
                .build();

        ownershipRecordRepository.save(ownershipRecord);

        // 5. Notify customer
        notificationService.createNotification(
                customer,
                NotificationType.GENERAL,
                "Apartment Purchase Finalized!",
                "Congratulations! Your purchase of " + apartment.getTitle() + " has been finalized. You are now the official owner!"
        );

        return SaleResponse.fromEntity(savedSale);
    }
}
