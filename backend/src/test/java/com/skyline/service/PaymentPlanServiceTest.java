package com.skyline.service;

import com.skyline.dto.payment.PaymentPlanRequest;
import com.skyline.dto.payment.PaymentPlanResponse;
import com.skyline.dto.payment.PaymentPlanDecisionRequest;
import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Payment;
import com.skyline.entity.PaymentPlan;
import com.skyline.entity.PaymentPlanItem;
import com.skyline.entity.Reservation;
import com.skyline.entity.User;
import com.skyline.enums.PaymentPlanStatus;
import com.skyline.enums.PaymentPlanType;
import com.skyline.enums.PaymentStatus;
import com.skyline.enums.PaymentType;
import com.skyline.enums.ReservationStatus;
import com.skyline.enums.UserRole;
import com.skyline.enums.UserStatus;
import com.skyline.exception.BadRequestException;
import com.skyline.observer.NotificationSubject;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.PaymentPlanItemRepository;
import com.skyline.repository.PaymentPlanRepository;
import com.skyline.repository.PaymentRepository;
import com.skyline.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentPlanServiceTest {

    @Mock
    private PaymentPlanRepository paymentPlanRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private ReservationService reservationService;

    @Mock
    private NotificationSubject notificationSubject;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ApartmentRepository apartmentRepository;

    @Mock
    private PaymentPlanItemRepository paymentPlanItemRepository;

    private PaymentPlanService paymentPlanService;

    private User customer;
    private UserPrincipal customerPrincipal;
    private User admin;
    private UserPrincipal adminPrincipal;
    private Apartment apartment;
    private Reservation activeReservation;

    @BeforeEach
    void setUp() {
        paymentPlanService = new PaymentPlanService(
                paymentPlanRepository,
                paymentRepository,
                reservationService,
                notificationSubject,
                notificationService,
                apartmentRepository,
                paymentPlanItemRepository
        );

        customer = User.builder()
                .id(10L)
                .name("Sarah Chen")
                .email("sarah.chen@email.com")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();
        customerPrincipal = new UserPrincipal(customer);

        admin = User.builder()
                .id(1L)
                .name("Admin User")
                .email("admin@skyline.com")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();
        adminPrincipal = new UserPrincipal(admin);

        apartment = Apartment.builder()
                .id(20L)
                .title("Riverside Royal Loft")
                .apartmentNumber("APT-020")
                .price(new BigDecimal("22500000"))
                .status(ApartmentStatus.RESERVED)
                .build();

        activeReservation = Reservation.builder()
                .id(107L)
                .apartment(apartment)
                .customer(customer)
                .reservationFee(new BigDecimal("2250000"))
                .status(ReservationStatus.CONFIRMED)
                .build();
    }

    private void setupValidReservationMock() {
        when(reservationService.getReservationEntityById(107L)).thenReturn(activeReservation);
        // Verified reservation fee exists
        when(paymentRepository.existsByReservationIdAndTypeAndStatus(
                eq(107L), eq(PaymentType.RESERVATION_FEE), eq(PaymentStatus.VERIFIED)
        )).thenReturn(true);
        when(paymentPlanRepository.existsByReservationIdAndStatusIn(eq(107L), any())).thenReturn(false);

        Payment feePayment = Payment.builder()
                .id(1L)
                .amount(new BigDecimal("2250000"))
                .status(PaymentStatus.VERIFIED)
                .build();
        when(paymentRepository.findByReservationId(107L)).thenReturn(List.of(feePayment));
    }

    @Test
    void testInstallmentPlanValidation_Accept2And60_Reject1And61() {
        setupValidReservationMock();

        when(paymentPlanRepository.save(any(PaymentPlan.class))).thenAnswer(inv -> {
            PaymentPlan p = inv.getArgument(0);
            p.setId(555L);
            return p;
        });

        // 1. Valid: 2 installments
        PaymentPlanRequest req2 = new PaymentPlanRequest(
                "107", PaymentPlanType.INSTALLMENT, 2, new BigDecimal("100"), LocalDate.now().plusDays(1), null
        );
        PaymentPlanResponse res2 = paymentPlanService.createPlan(customerPrincipal, req2);
        assertNotNull(res2);
        assertEquals(2, res2.getNumberOfPayments());

        // 2. Valid: 60 installments
        PaymentPlanRequest req60 = new PaymentPlanRequest(
                "107", PaymentPlanType.INSTALLMENT, 60, new BigDecimal("100"), LocalDate.now().plusDays(1), null
        );
        PaymentPlanResponse res60 = paymentPlanService.createPlan(customerPrincipal, req60);
        assertNotNull(res60);
        assertEquals(60, res60.getNumberOfPayments());

        // 3. Invalid: 1 installment (must be rejected)
        PaymentPlanRequest req1 = new PaymentPlanRequest(
                "107", PaymentPlanType.INSTALLMENT, 1, new BigDecimal("100"), LocalDate.now().plusDays(1), null
        );
        BadRequestException ex1 = assertThrows(BadRequestException.class, () ->
                paymentPlanService.createPlan(customerPrincipal, req1)
        );
        assertTrue(ex1.getMessage().contains("between 2 and 60"));

        // 4. Invalid: 61 installments (must be rejected)
        PaymentPlanRequest req61 = new PaymentPlanRequest(
                "107", PaymentPlanType.INSTALLMENT, 61, new BigDecimal("100"), LocalDate.now().plusDays(1), null
        );
        BadRequestException ex61 = assertThrows(BadRequestException.class, () ->
                paymentPlanService.createPlan(customerPrincipal, req61)
        );
        assertTrue(ex61.getMessage().contains("between 2 and 60"));
    }

    @Test
    void testPartPaymentPlanValidation_Accept2And5_Reject1And6() {
        setupValidReservationMock();

        when(paymentPlanRepository.save(any(PaymentPlan.class))).thenAnswer(inv -> {
            PaymentPlan p = inv.getArgument(0);
            p.setId(556L);
            return p;
        });

        // 1. Valid: 2 parts
        PaymentPlanRequest req2 = new PaymentPlanRequest(
                "107", PaymentPlanType.PART_PAYMENT, 2, new BigDecimal("500"), LocalDate.now().plusDays(1), null
        );
        PaymentPlanResponse res2 = paymentPlanService.createPlan(customerPrincipal, req2);
        assertNotNull(res2);
        assertEquals(2, res2.getNumberOfPayments());

        // 2. Valid: 5 parts
        PaymentPlanRequest req5 = new PaymentPlanRequest(
                "107", PaymentPlanType.PART_PAYMENT, 5, new BigDecimal("500"), LocalDate.now().plusDays(1), null
        );
        PaymentPlanResponse res5 = paymentPlanService.createPlan(customerPrincipal, req5);
        assertNotNull(res5);
        assertEquals(5, res5.getNumberOfPayments());

        // 3. Invalid: 1 part (must be rejected)
        PaymentPlanRequest req1 = new PaymentPlanRequest(
                "107", PaymentPlanType.PART_PAYMENT, 1, new BigDecimal("500"), LocalDate.now().plusDays(1), null
        );
        BadRequestException ex1 = assertThrows(BadRequestException.class, () ->
                paymentPlanService.createPlan(customerPrincipal, req1)
        );
        assertTrue(ex1.getMessage().contains("between 2 and 5"));

        // 4. Invalid: 6 parts (must be rejected)
        PaymentPlanRequest req6 = new PaymentPlanRequest(
                "107", PaymentPlanType.PART_PAYMENT, 6, new BigDecimal("500"), LocalDate.now().plusDays(1), null
        );
        BadRequestException ex6 = assertThrows(BadRequestException.class, () ->
                paymentPlanService.createPlan(customerPrincipal, req6)
        );
        assertTrue(ex6.getMessage().contains("between 2 and 5"));
    }

    @Test
    void testAuthoritativeBackendCalculation_IgnoresManipulatedAmount() {
        setupValidReservationMock();

        ArgumentCaptor<PaymentPlan> captor = ArgumentCaptor.forClass(PaymentPlan.class);
        when(paymentPlanRepository.save(captor.capture())).thenAnswer(inv -> {
            PaymentPlan p = inv.getArgument(0);
            p.setId(777L);
            return p;
        });

        // Client attempts to pass a manipulated paymentAmount = 100.00
        // Total price = 22,500,000, verifiedPaid = 2,250,000 => outstanding = 20,250,000
        // For 12 installments: 20,250,000 / 12 = 1,687,500.00
        PaymentPlanRequest manipulatedReq = new PaymentPlanRequest(
                "107", PaymentPlanType.INSTALLMENT, 12, new BigDecimal("100"), LocalDate.now().plusDays(1), null
        );

        paymentPlanService.createPlan(customerPrincipal, manipulatedReq);

        PaymentPlan savedPlan = captor.getValue();
        assertNotNull(savedPlan);
        // Backend authoritatively calculated paymentAmount must be exactly 1,687,500.00
        assertEquals(new BigDecimal("1687500.00"), savedPlan.getPaymentAmount());
        assertEquals(new BigDecimal("20250000"), savedPlan.getTotalPlanAmount());
    }

    @Test
    void testScheduleItemsSumExactlyEqualsTotalPlanAmount() {
        // Apartment price = 22,500,000, deposit = 2,250,000, outstanding = 20,250,000
        // Test dividing 20,250,000 into 7 installments to verify remainder handling
        PaymentPlan plan = PaymentPlan.builder()
                .id(888L)
                .reservation(activeReservation)
                .customer(customer)
                .apartment(apartment)
                .planType(PaymentPlanType.INSTALLMENT)
                .numberOfPayments(7)
                .paymentAmount(new BigDecimal("2892857.14"))
                .totalPlanAmount(new BigDecimal("20250000"))
                .remainingAmount(new BigDecimal("20250000"))
                .startDate(LocalDate.now().plusDays(5))
                .status(PaymentPlanStatus.PENDING)
                .build();

        when(paymentPlanRepository.findById(888L)).thenReturn(Optional.of(plan));
        when(paymentPlanRepository.save(any(PaymentPlan.class))).thenAnswer(inv -> inv.getArgument(0));

        Payment feePayment = Payment.builder()
                .id(1L)
                .amount(new BigDecimal("2250000"))
                .status(PaymentStatus.VERIFIED)
                .build();
        when(paymentRepository.findByReservationId(107L)).thenReturn(List.of(feePayment));

        List<PaymentPlanItem> savedItems = new ArrayList<>();
        when(paymentPlanItemRepository.save(any(PaymentPlanItem.class))).thenAnswer(inv -> {
            PaymentPlanItem item = inv.getArgument(0);
            savedItems.add(item);
            return item;
        });

        PaymentPlanDecisionRequest approveReq = new PaymentPlanDecisionRequest(
                "Approved 7 installments", BigDecimal.ZERO, BigDecimal.ZERO
        );

        PaymentPlanResponse approved = paymentPlanService.approvePlan(888L, approveReq, adminPrincipal);

        assertNotNull(approved);
        assertEquals(7, savedItems.size());

        // Verify that the sum of all installments exactly equals totalPlanAmount (no money lost or created)
        BigDecimal sumItems = savedItems.stream()
                .map(PaymentPlanItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(new BigDecimal("20250000.00"), sumItems);
    }

    @Test
    void testCannotCreatePlanForCancelledOrExpiredReservation() {
        activeReservation.setStatus(ReservationStatus.CANCELLED);
        when(reservationService.getReservationEntityById(107L)).thenReturn(activeReservation);

        PaymentPlanRequest req = new PaymentPlanRequest(
                "107", PaymentPlanType.INSTALLMENT, 12, new BigDecimal("100"), LocalDate.now().plusDays(1), null
        );

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                paymentPlanService.createPlan(customerPrincipal, req)
        );
        assertTrue(ex.getMessage().contains("cancelled or expired"));
    }

    @Test
    void testCannotCreatePlanWithoutVerifiedReservationFee() {
        when(reservationService.getReservationEntityById(107L)).thenReturn(activeReservation);
        // Reservation fee is NOT verified
        when(paymentRepository.existsByReservationIdAndTypeAndStatus(
                eq(107L), eq(PaymentType.RESERVATION_FEE), eq(PaymentStatus.VERIFIED)
        )).thenReturn(false);

        PaymentPlanRequest req = new PaymentPlanRequest(
                "107", PaymentPlanType.INSTALLMENT, 12, new BigDecimal("100"), LocalDate.now().plusDays(1), null
        );

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                paymentPlanService.createPlan(customerPrincipal, req)
        );
        assertTrue(ex.getMessage().contains("after your reservation payment is approved"));
    }
}
