package com.skyline.service;

import com.skyline.decorator.sale.BasicSaleStatement;
import com.skyline.decorator.sale.PaymentPlanScheduleDecorator;
import com.skyline.decorator.sale.PaymentSummaryDecorator;
import com.skyline.decorator.sale.SaleStatementComponent;
import com.skyline.dto.apartment.ApartmentResponse;
import com.skyline.dto.payment.PaymentPlanItemResponse;
import com.skyline.dto.payment.PaymentPlanResponse;
import com.skyline.dto.payment.PaymentResponse;
import com.skyline.dto.reservation.ReservationResponse;
import com.skyline.dto.sale.PurchasedApartmentResponse;
import com.skyline.dto.sale.SaleDetailsResponse;
import com.skyline.dto.sale.SaleRequest;
import com.skyline.dto.sale.SaleResponse;
import com.skyline.dto.user.UserDto;
import com.skyline.entity.*;
import com.skyline.enums.NotificationType;
import com.skyline.enums.PaymentStatus;
import com.skyline.enums.ReservationStatus;
import com.skyline.exception.BadRequestException;
import com.skyline.exception.ConflictException;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.observer.NotificationEvent;
import com.skyline.observer.NotificationSubject;
import com.skyline.repository.*;
import com.skyline.security.UserPrincipal;
import com.skyline.util.IdParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final ApartmentRepository apartmentRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentPlanRepository paymentPlanRepository;
    private final PaymentPlanItemRepository paymentPlanItemRepository;
    private final UserService userService;
    private final NotificationSubject notificationSubject;
    private final FinancialAnalyticsService financialAnalyticsService;
    private final ApartmentAvailabilityService availabilityService;

    public SaleService(SaleRepository saleRepository,
                       ApartmentRepository apartmentRepository,
                       ReservationRepository reservationRepository,
                       PaymentRepository paymentRepository,
                       PaymentPlanRepository paymentPlanRepository,
                       PaymentPlanItemRepository paymentPlanItemRepository,
                       UserService userService,
                       NotificationSubject notificationSubject,
                       FinancialAnalyticsService financialAnalyticsService) {
        this(saleRepository, apartmentRepository, reservationRepository, paymentRepository,
                paymentPlanRepository, paymentPlanItemRepository, userService, notificationSubject,
                financialAnalyticsService,
                new ApartmentAvailabilityService(apartmentRepository, reservationRepository, saleRepository));
    }

    @org.springframework.beans.factory.annotation.Autowired
    public SaleService(SaleRepository saleRepository,
                       ApartmentRepository apartmentRepository,
                       ReservationRepository reservationRepository,
                       PaymentRepository paymentRepository,
                       PaymentPlanRepository paymentPlanRepository,
                       PaymentPlanItemRepository paymentPlanItemRepository,
                       UserService userService,
                       NotificationSubject notificationSubject,
                       FinancialAnalyticsService financialAnalyticsService,
                       ApartmentAvailabilityService availabilityService) {
        this.saleRepository = saleRepository;
        this.apartmentRepository = apartmentRepository;
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
        this.paymentPlanRepository = paymentPlanRepository;
        this.paymentPlanItemRepository = paymentPlanItemRepository;
        this.userService = userService;
        this.notificationSubject = notificationSubject;
        this.financialAnalyticsService = financialAnalyticsService;
        this.availabilityService = availabilityService;
    }

    public com.skyline.dto.sale.SalesSummaryResponse getSalesSummary() {
        return financialAnalyticsService.getSalesSummary();
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

    public SaleDetailsResponse getSaleDetails(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with id: " + id));

        // Decorator Pattern: 1. Core Component
        SaleStatementComponent statement = new BasicSaleStatement(sale);

        // Decorator Pattern: 2. Concrete Decorator for Payment Summary and Records
        statement = new PaymentSummaryDecorator(statement, sale, paymentRepository);

        // Decorator Pattern: 3. Concrete Decorator for Payment Plan Schedule
        statement = new PaymentPlanScheduleDecorator(statement, sale, paymentPlanRepository, paymentPlanItemRepository);

        // Decorator Pattern: 4. Assemble final decorated statement
        return statement.generateStatement();
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

        // 1. Mark apartment as SOLD via centralized availability service
        availabilityService.markSold(apartment);

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
                .ownershipDate(saleDate)
                .ownershipStatus("Deed Transferred")
                .staff(staff)
                .staffName(staff != null ? staff.getName() : "Staff Member")
                .createdAt(LocalDateTime.now())
                .build();

        Sale savedSale = saleRepository.save(sale);

        // 4. Notify customer
        notificationSubject.notifyObservers(new NotificationEvent(
                customer,
                NotificationType.GENERAL,
                "Apartment Purchase Finalized!",
                "Congratulations! Your purchase of " + apartment.getTitle() + " has been finalized. You are now the official owner!"
        ));

        return SaleResponse.fromEntity(savedSale);
    }

    @Transactional(readOnly = true)
    public List<PurchasedApartmentResponse> getPurchasedApartmentsForCustomer(UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            return List.of();
        }
        Long customerId = principal.getUser().getId();
        String customerEmail = principal.getUser().getEmail();
        List<Sale> sales = saleRepository.findByCustomerIdOrCustomerEmail(customerId, customerEmail);

        return sales.stream()
                .sorted((a, b) -> {
                    if (a.getSaleDate() == null && b.getSaleDate() == null) return 0;
                    if (a.getSaleDate() == null) return 1;
                    if (b.getSaleDate() == null) return -1;
                    return b.getSaleDate().compareTo(a.getSaleDate());
                })
                .map(PurchasedApartmentResponse::fromSale)
                .collect(Collectors.toList());
    }
}
