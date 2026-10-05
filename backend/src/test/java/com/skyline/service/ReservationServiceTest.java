package com.skyline.service;

import com.skyline.dto.reservation.ReservationRequest;
import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Reservation;
import com.skyline.entity.User;
import com.skyline.enums.AppointmentStatus;
import com.skyline.enums.ReservationStatus;
import com.skyline.enums.UserRole;
import com.skyline.enums.UserStatus;
import com.skyline.exception.BadRequestException;
import com.skyline.exception.ConflictException;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.AppointmentRepository;
import com.skyline.repository.ReservationRepository;
import com.skyline.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import com.skyline.dto.reservation.ReservationRefundResponse;
import com.skyline.dto.reservation.RefundSettlementRequest;
import com.skyline.dto.reservation.RecordRefundPaymentRequest;
import com.skyline.entity.Payment;
import com.skyline.entity.ReservationRefund;
import com.skyline.enums.PaymentStatus;
import com.skyline.enums.PaymentType;
import com.skyline.enums.RefundStatus;
import com.skyline.exception.ForbiddenException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ApartmentRepository apartmentRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private com.skyline.repository.PaymentRepository paymentRepository;

    @Mock
    private com.skyline.repository.PaymentPlanRepository paymentPlanRepository;

    @Mock
    private com.skyline.repository.ReservationRefundRepository reservationRefundRepository;

    @Mock
    private com.skyline.repository.SaleRepository saleRepository;

    @Mock
    private UserService userService;

    @Mock
    private com.skyline.observer.NotificationSubject notificationSubject;

    private ReservationService reservationService;

    private User customer;
    private UserPrincipal customerPrincipal;
    private User otherCustomer;
    private UserPrincipal otherCustomerPrincipal;
    private User admin;
    private UserPrincipal adminPrincipal;
    private User staff;
    private UserPrincipal staffPrincipal;
    private Apartment availableApartment;

    @BeforeEach
    void setUp() {
        reservationService = new ReservationService(
                reservationRepository,
                apartmentRepository,
                appointmentRepository,
                paymentRepository,
                paymentPlanRepository,
                reservationRefundRepository,
                saleRepository,
                userService,
                notificationSubject
        );

        customer = User.builder()
                .id(10L)
                .name("Sarah Chen")
                .email("sarah.chen@email.com")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();
        customerPrincipal = new UserPrincipal(customer);

        otherCustomer = User.builder()
                .id(99L)
                .name("Other Customer")
                .email("other@email.com")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();
        otherCustomerPrincipal = new UserPrincipal(otherCustomer);

        admin = User.builder()
                .id(1L)
                .name("Admin User")
                .email("admin@skyline.com")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();
        adminPrincipal = new UserPrincipal(admin);

        staff = User.builder()
                .id(2L)
                .name("Staff Member")
                .email("staff@skyline.com")
                .role(UserRole.STAFF)
                .status(UserStatus.ACTIVE)
                .build();
        staffPrincipal = new UserPrincipal(staff);

        availableApartment = Apartment.builder()
                .id(1L)
                .title("Skyline Penthouse")
                .apartmentNumber("APT-001")
                .status(ApartmentStatus.AVAILABLE)
                .price(new BigDecimal("25000000"))
                .build();
    }

    @Test
    void testCannotReserveUnavailableApartment() {
        availableApartment.setStatus(ApartmentStatus.RESERVED);
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(availableApartment));

        com.skyline.entity.Appointment compAppt = com.skyline.entity.Appointment.builder()
                .id(5L)
                .apartment(availableApartment)
                .customer(customer)
                .status(AppointmentStatus.COMPLETED)
                .build();
        when(appointmentRepository.findFirstByApartmentIdAndCustomerIdAndStatusOrderByDateDesc(eq(1L), eq(10L), eq(AppointmentStatus.COMPLETED)))
                .thenReturn(Optional.of(compAppt));

        ReservationRequest request = new ReservationRequest("APT-001", new BigDecimal("500000"), null, null, null);

        assertThrows(ConflictException.class, () -> reservationService.createReservation(customerPrincipal, request));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void testCannotReserveWithoutEligibleViewing() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(availableApartment));
        when(appointmentRepository.findFirstByApartmentIdAndCustomerIdAndStatusOrderByDateDesc(eq(1L), eq(10L), eq(AppointmentStatus.COMPLETED)))
                .thenReturn(Optional.empty());

        ReservationRequest request = new ReservationRequest("APT-001", new BigDecimal("500000"), null, null, null);

        assertThrows(BadRequestException.class, () -> reservationService.createReservation(customerPrincipal, request));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void testDuplicateActiveReservationPrevented() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(availableApartment));

        com.skyline.entity.Appointment compAppt = com.skyline.entity.Appointment.builder()
                .id(5L)
                .apartment(availableApartment)
                .customer(customer)
                .status(AppointmentStatus.COMPLETED)
                .build();
        when(appointmentRepository.findFirstByApartmentIdAndCustomerIdAndStatusOrderByDateDesc(eq(1L), eq(10L), eq(AppointmentStatus.COMPLETED)))
                .thenReturn(Optional.of(compAppt));
        when(reservationRepository.existsByApartmentIdAndStatusIn(eq(1L), any())).thenReturn(true);

        ReservationRequest request = new ReservationRequest("APT-001", new BigDecimal("500000"), null, null, null);

        assertThrows(ConflictException.class, () -> reservationService.createReservation(customerPrincipal, request));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void testReservationExpirationReleasesApartment() {
        Apartment reservedApartment = Apartment.builder()
                .id(2L)
                .title("Oceanfront Villa")
                .apartmentNumber("APT-002")
                .status(ApartmentStatus.RESERVED)
                .build();

        Reservation expiredReservation = Reservation.builder()
                .id(50L)
                .apartment(reservedApartment)
                .customer(customer)
                .status(ReservationStatus.PENDING)
                .expiresAt(LocalDateTime.now().minusHours(1))
                .build();

        when(reservationRepository.findByStatusAndExpiresAtBefore(eq(ReservationStatus.PENDING), any()))
                .thenReturn(Collections.singletonList(expiredReservation));
        when(apartmentRepository.findById(2L)).thenReturn(Optional.of(reservedApartment));
        when(reservationRepository.existsByApartmentIdAndStatusIn(eq(2L), any())).thenReturn(false);

        reservationService.expireOverdueReservations();

        assertEquals(ReservationStatus.EXPIRED, expiredReservation.getStatus());
        assertEquals(ApartmentStatus.AVAILABLE, reservedApartment.getStatus());
        verify(apartmentRepository).save(reservedApartment);
        verify(reservationRepository).save(expiredReservation);
    }

    @Test
    void testSoldApartmentNotRevertedToAvailableOnExpiry() {
        Apartment soldApartment = Apartment.builder()
                .id(3L)
                .title("Luxury Sold Villa")
                .apartmentNumber("APT-003")
                .status(ApartmentStatus.SOLD)
                .build();

        Reservation expiredReservation = Reservation.builder()
                .id(51L)
                .apartment(soldApartment)
                .customer(customer)
                .status(ReservationStatus.PENDING)
                .expiresAt(LocalDateTime.now().minusHours(1))
                .build();

        when(reservationRepository.findByStatusAndExpiresAtBefore(eq(ReservationStatus.PENDING), any()))
                .thenReturn(Collections.singletonList(expiredReservation));
        when(apartmentRepository.findById(3L)).thenReturn(Optional.of(soldApartment));

        reservationService.expireOverdueReservations();

        assertEquals(ReservationStatus.EXPIRED, expiredReservation.getStatus());
        assertEquals(ApartmentStatus.SOLD, soldApartment.getStatus());
        verify(apartmentRepository, never()).save(soldApartment);
    }

    @Test
    void testCannotCancelReservationWithFullPayment() {
        Reservation reservation = Reservation.builder()
                .id(60L)
                .apartment(availableApartment)
                .customer(customer)
                .reservationFee(new BigDecimal("2500000"))
                .status(ReservationStatus.CONFIRMED)
                .build();

        when(reservationRepository.findById(60L)).thenReturn(Optional.of(reservation));

        com.skyline.entity.Payment fullPayment = com.skyline.entity.Payment.builder()
                .id(101L)
                .reservation(reservation)
                .apartment(availableApartment)
                .customer(customer)
                .type(com.skyline.enums.PaymentType.FULL_PAYMENT)
                .status(com.skyline.enums.PaymentStatus.VERIFIED)
                .amount(new BigDecimal("25000000"))
                .build();

        when(paymentRepository.findByReservationId(60L)).thenReturn(List.of(fullPayment));

        com.skyline.dto.reservation.ReservationCancellationRequest request =
                new com.skyline.dto.reservation.ReservationCancellationRequest(
                        new BigDecimal("2000000"),
                        new BigDecimal("500000"),
                        "Customer requested",
                        null
                );

        assertThrows(BadRequestException.class, () ->
                reservationService.cancelReservationWithRefund(60L, request, customerPrincipal)
        );

        verify(reservationRepository, never()).save(any());
    }

    @Test
    void testCannotCancelReservationWithActivePaymentPlan() {
        Reservation reservation = Reservation.builder()
                .id(61L)
                .apartment(availableApartment)
                .customer(customer)
                .reservationFee(new BigDecimal("2500000"))
                .status(ReservationStatus.CONFIRMED)
                .build();

        when(reservationRepository.findById(61L)).thenReturn(Optional.of(reservation));

        com.skyline.dto.reservation.ReservationCancellationRequest request =
                new com.skyline.dto.reservation.ReservationCancellationRequest(
                        new BigDecimal("2000000"),
                        new BigDecimal("500000"),
                        "Customer requested",
                        null
                );

        assertThrows(BadRequestException.class, () ->
                reservationService.cancelReservationWithRefund(61L, request, customerPrincipal)
        );

        verify(reservationRepository, never()).save(any());
    }

    @Test
    void testCannotCancelReservationWithPartPayment() {
        Reservation reservation = Reservation.builder()
                .id(62L)
                .apartment(availableApartment)
                .customer(customer)
                .reservationFee(new BigDecimal("2500000"))
                .status(ReservationStatus.CONFIRMED)
                .build();

        when(reservationRepository.findById(62L)).thenReturn(Optional.of(reservation));

        com.skyline.entity.Payment partPayment = com.skyline.entity.Payment.builder()
                .id(102L)
                .reservation(reservation)
                .apartment(availableApartment)
                .customer(customer)
                .type(com.skyline.enums.PaymentType.PART_PAYMENT)
                .status(com.skyline.enums.PaymentStatus.VERIFIED)
                .amount(new BigDecimal("5000000"))
                .build();

        when(paymentRepository.findByReservationId(62L)).thenReturn(List.of(partPayment));

        com.skyline.dto.reservation.ReservationCancellationRequest request =
                new com.skyline.dto.reservation.ReservationCancellationRequest(
                        new BigDecimal("2000000"),
                        new BigDecimal("500000"),
                        "Customer requested",
                        null
                );

        assertThrows(BadRequestException.class, () ->
                reservationService.cancelReservationWithRefund(62L, request, customerPrincipal)
        );

        verify(reservationRepository, never()).save(any());
    }

    @Test
    void testActivePaymentPlanReservationNotExpiredByScheduler() {
        Reservation rsvWithPlan = Reservation.builder()
                .id(63L)
                .apartment(availableApartment)
                .customer(customer)
                .status(ReservationStatus.PENDING)
                .expiresAt(LocalDateTime.now().minusHours(2))
                .build();

        when(reservationRepository.findByStatusAndExpiresAtBefore(eq(ReservationStatus.PENDING), any()))
                .thenReturn(List.of(rsvWithPlan));
        when(paymentPlanRepository.existsByReservationIdAndStatusIn(eq(63L), any())).thenReturn(true);

        reservationService.expireOverdueReservations();

        // Must remain PENDING and NOT set to EXPIRED
        assertEquals(ReservationStatus.PENDING, rsvWithPlan.getStatus());
        verify(reservationRepository, never()).save(rsvWithPlan);
    }

    // =========================================================================
    // 13 Tests for Customer Cancellation & 48-Hour Refund Workflow
    // =========================================================================

    private Reservation createConfirmedReservation(Long id, BigDecimal fee) {
        return Reservation.builder()
                .id(id)
                .apartment(availableApartment)
                .customer(customer)
                .customerName("Sarah Chen")
                .customerEmail("sarah.chen@email.com")
                .reservationFee(fee)
                .status(ReservationStatus.CONFIRMED)
                .createdAt(LocalDateTime.of(2026, 10, 5, 9, 0, 0))
                .expiresAt(LocalDateTime.of(2026, 10, 9, 9, 0, 0))
                .build();
    }

    private Payment createVerifiedPayment(Reservation reservation, LocalDateTime verifiedAt) {
        return Payment.builder()
                .id(301L)
                .reservation(reservation)
                .apartment(reservation.getApartment())
                .customer(reservation.getCustomer())
                .type(PaymentType.RESERVATION_FEE)
                .status(PaymentStatus.VERIFIED)
                .amount(reservation.getReservationFee())
                .verifiedAt(verifiedAt)
                .uploadedAt(verifiedAt.minusMinutes(30))
                .build();
    }

    @Test
    void testCancellationAt1HourAfterPaymentAllowed() {
        LocalDateTime paymentTime = LocalDateTime.of(2026, 10, 5, 10, 0, 0);
        Reservation reservation = createConfirmedReservation(71L, new BigDecimal("2500000"));
        Payment payment = createVerifiedPayment(reservation, paymentTime);

        when(reservationRepository.findById(71L)).thenReturn(Optional.of(reservation));
        when(paymentRepository.findByReservationId(71L)).thenReturn(List.of(payment));
        when(reservationRefundRepository.existsByReservationId(71L)).thenReturn(false);
        when(saleRepository.findByApartmentId(1L)).thenReturn(Optional.empty());
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(availableApartment));
        when(reservationRepository.existsByApartmentIdAndStatusIn(eq(1L), any())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reservationRefundRepository.save(any(ReservationRefund.class))).thenAnswer(inv -> {
            ReservationRefund r = inv.getArgument(0);
            r.setId(901L);
            return r;
        });

        // Current time: 1 hour after payment
        Instant currentInstant = paymentTime.plusHours(1).atZone(ZoneId.systemDefault()).toInstant();
        reservationService.setClock(Clock.fixed(currentInstant, ZoneId.systemDefault()));

        ReservationRefundResponse response = reservationService.cancelReservationWithRefund(71L, null, customerPrincipal);

        assertNotNull(response);
        assertEquals("CANCELLED", response.getReservationStatus());
        assertEquals(Boolean.TRUE, response.getRefundEligible());
        assertNull(response.getRefundAmount());
        assertNull(response.getCompanyRetainedAmount());
        assertEquals(RefundStatus.PENDING_REVIEW, response.getRefundStatus());
        assertEquals("CUSTOMER", response.getInitiatedByRole());
        assertEquals(ReservationStatus.CANCELLED, reservation.getStatus());
        assertEquals(ApartmentStatus.AVAILABLE, availableApartment.getStatus());
        verify(reservationRefundRepository, times(1)).save(any(ReservationRefund.class));
    }

    @Test
    void testCancellationAt47Hours59MinutesAllowed() {
        LocalDateTime paymentTime = LocalDateTime.of(2026, 10, 5, 10, 0, 0);
        Reservation reservation = createConfirmedReservation(72L, new BigDecimal("2500000"));
        Payment payment = createVerifiedPayment(reservation, paymentTime);

        when(reservationRepository.findById(72L)).thenReturn(Optional.of(reservation));
        when(paymentRepository.findByReservationId(72L)).thenReturn(List.of(payment));
        when(reservationRefundRepository.existsByReservationId(72L)).thenReturn(false);
        when(saleRepository.findByApartmentId(1L)).thenReturn(Optional.empty());
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(availableApartment));
        when(reservationRepository.existsByApartmentIdAndStatusIn(eq(1L), any())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reservationRefundRepository.save(any(ReservationRefund.class))).thenAnswer(inv -> {
            ReservationRefund r = inv.getArgument(0);
            r.setId(902L);
            return r;
        });

        // Current time: 47 hours and 59 minutes after payment
        Instant currentInstant = paymentTime.plusHours(47).plusMinutes(59).atZone(ZoneId.systemDefault()).toInstant();
        reservationService.setClock(Clock.fixed(currentInstant, ZoneId.systemDefault()));

        ReservationRefundResponse response = reservationService.cancelReservationWithRefund(72L, null, customerPrincipal);

        assertNotNull(response);
        assertEquals("CANCELLED", response.getReservationStatus());
        assertEquals(Boolean.TRUE, response.getRefundEligible());
        assertNull(response.getRefundAmount());
        assertEquals(RefundStatus.PENDING_REVIEW, response.getRefundStatus());
        verify(reservationRefundRepository, times(1)).save(any(ReservationRefund.class));
    }

    @Test
    void testCancellationExactlyAt48HoursAllowed() {
        LocalDateTime paymentTime = LocalDateTime.of(2026, 10, 5, 10, 0, 0);
        Reservation reservation = createConfirmedReservation(73L, new BigDecimal("2500000"));
        Payment payment = createVerifiedPayment(reservation, paymentTime);

        when(reservationRepository.findById(73L)).thenReturn(Optional.of(reservation));
        when(paymentRepository.findByReservationId(73L)).thenReturn(List.of(payment));
        when(reservationRefundRepository.existsByReservationId(73L)).thenReturn(false);
        when(saleRepository.findByApartmentId(1L)).thenReturn(Optional.empty());
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(availableApartment));
        when(reservationRepository.existsByApartmentIdAndStatusIn(eq(1L), any())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reservationRefundRepository.save(any(ReservationRefund.class))).thenAnswer(inv -> {
            ReservationRefund r = inv.getArgument(0);
            r.setId(903L);
            return r;
        });

        // Current time: exactly 48 hours after payment
        Instant currentInstant = paymentTime.plusHours(48).atZone(ZoneId.systemDefault()).toInstant();
        reservationService.setClock(Clock.fixed(currentInstant, ZoneId.systemDefault()));

        ReservationRefundResponse response = reservationService.cancelReservationWithRefund(73L, null, customerPrincipal);

        assertNotNull(response);
        assertEquals("CANCELLED", response.getReservationStatus());
        assertEquals(Boolean.TRUE, response.getRefundEligible());
        assertNull(response.getRefundAmount());
        assertEquals(RefundStatus.PENDING_REVIEW, response.getRefundStatus());
        verify(reservationRefundRepository, times(1)).save(any(ReservationRefund.class));
    }

    @Test
    void testCancellationAfter48HoursRejected() {
        LocalDateTime paymentTime = LocalDateTime.of(2026, 10, 5, 10, 0, 0);
        Reservation reservation = createConfirmedReservation(74L, new BigDecimal("2500000"));
        Payment payment = createVerifiedPayment(reservation, paymentTime);

        when(reservationRepository.findById(74L)).thenReturn(Optional.of(reservation));
        when(paymentRepository.findByReservationId(74L)).thenReturn(List.of(payment));
        when(reservationRefundRepository.existsByReservationId(74L)).thenReturn(false);
        when(saleRepository.findByApartmentId(1L)).thenReturn(Optional.empty());

        // Current time: 48 hours and 1 minute after payment
        Instant currentInstant = paymentTime.plusHours(48).plusMinutes(1).atZone(ZoneId.systemDefault()).toInstant();
        reservationService.setClock(Clock.fixed(currentInstant, ZoneId.systemDefault()));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                reservationService.cancelReservationWithRefund(74L, null, customerPrincipal)
        );

        assertTrue(ex.getMessage().contains("REFUND_WINDOW_EXPIRED") || ex.getMessage().contains("48-hour refund period has expired"));
        verify(reservationRefundRepository, never()).save(any());
        assertEquals(ReservationStatus.CONFIRMED, reservation.getStatus());
    }

    @Test
    void testCustomerAttemptsToCancelAnotherCustomerReservationRejected() {
        Reservation reservation = createConfirmedReservation(75L, new BigDecimal("2500000"));
        when(reservationRepository.findById(75L)).thenReturn(Optional.of(reservation));

        User otherCustomer = User.builder()
                .id(99L)
                .name("Other Customer")
                .email("other@email.com")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();
        UserPrincipal otherPrincipal = new UserPrincipal(otherCustomer);

        assertThrows(ForbiddenException.class, () ->
                reservationService.cancelReservationWithRefund(75L, null, otherPrincipal)
        );

        verify(reservationRefundRepository, never()).save(any());
        assertEquals(ReservationStatus.CONFIRMED, reservation.getStatus());
    }

    @Test
    void testAlreadyCancelledReservationRejected() {
        Reservation reservation = createConfirmedReservation(76L, new BigDecimal("2500000"));
        reservation.setStatus(ReservationStatus.CANCELLED);
        when(reservationRepository.findById(76L)).thenReturn(Optional.of(reservation));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                reservationService.cancelReservationWithRefund(76L, null, customerPrincipal)
        );

        assertTrue(ex.getMessage().contains("already cancelled"));
        verify(reservationRefundRepository, never()).save(any());
    }

    @Test
    void testDuplicateRefundRequestRejected() {
        Reservation reservation = createConfirmedReservation(77L, new BigDecimal("2500000"));
        when(reservationRepository.findById(77L)).thenReturn(Optional.of(reservation));
        when(reservationRefundRepository.existsByReservationId(77L)).thenReturn(true);

        assertThrows(ConflictException.class, () ->
                reservationService.cancelReservationWithRefund(77L, null, customerPrincipal)
        );

        verify(reservationRefundRepository, never()).save(any());
    }

    @Test
    void testPaymentRecordMissingHandledSafely() {
        Reservation reservation = createConfirmedReservation(78L, new BigDecimal("2500000"));
        when(reservationRepository.findById(78L)).thenReturn(Optional.of(reservation));
        when(reservationRefundRepository.existsByReservationId(78L)).thenReturn(false);
        when(saleRepository.findByApartmentId(1L)).thenReturn(Optional.empty());
        when(paymentRepository.findByReservationId(78L)).thenReturn(Collections.emptyList());
        when(paymentRepository.findByApartmentId(1L)).thenReturn(Collections.emptyList());

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                reservationService.cancelReservationWithRefund(78L, null, customerPrincipal)
        );

        assertTrue(ex.getMessage().contains("payment was not found"));
        verify(reservationRefundRepository, never()).save(any());
    }

    @Test
    void testUnpaidOrFailedPaymentRefundNotAllowed() {
        Reservation reservation = createConfirmedReservation(79L, new BigDecimal("2500000"));
        Payment pendingPayment = createVerifiedPayment(reservation, LocalDateTime.now());
        pendingPayment.setStatus(PaymentStatus.PENDING);

        when(reservationRepository.findById(79L)).thenReturn(Optional.of(reservation));
        when(reservationRefundRepository.existsByReservationId(79L)).thenReturn(false);
        when(saleRepository.findByApartmentId(1L)).thenReturn(Optional.empty());
        when(paymentRepository.findByReservationId(79L)).thenReturn(List.of(pendingPayment));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                reservationService.cancelReservationWithRefund(79L, null, customerPrincipal)
        );

        assertTrue(ex.getMessage().contains("payment was not found or has not been successfully verified"));
        verify(reservationRefundRepository, never()).save(any());
    }

    @Test
    void testSuccessfulCancellationCreatesExactlyOneRefundRecord() {
        LocalDateTime paymentTime = LocalDateTime.of(2026, 10, 5, 10, 0, 0);
        Reservation reservation = createConfirmedReservation(80L, new BigDecimal("2250000"));
        Payment payment = createVerifiedPayment(reservation, paymentTime);

        when(reservationRepository.findById(80L)).thenReturn(Optional.of(reservation));
        when(paymentRepository.findByReservationId(80L)).thenReturn(List.of(payment));
        when(reservationRefundRepository.existsByReservationId(80L)).thenReturn(false);
        when(saleRepository.findByApartmentId(1L)).thenReturn(Optional.empty());
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(availableApartment));
        when(reservationRepository.existsByApartmentIdAndStatusIn(eq(1L), any())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reservationRefundRepository.save(any(ReservationRefund.class))).thenAnswer(inv -> {
            ReservationRefund r = inv.getArgument(0);
            r.setId(905L);
            return r;
        });

        Instant currentInstant = paymentTime.plusHours(2).atZone(ZoneId.systemDefault()).toInstant();
        reservationService.setClock(Clock.fixed(currentInstant, ZoneId.systemDefault()));

        com.skyline.dto.reservation.ReservationCancellationRequest request =
                new com.skyline.dto.reservation.ReservationCancellationRequest(null, null, "Family emergency", null);

        ReservationRefundResponse response = reservationService.cancelReservationWithRefund(80L, request, customerPrincipal);

        assertNotNull(response);
        assertNull(response.getRefundAmount());
        assertNull(response.getCompanyRetainedAmount());
        assertEquals(RefundStatus.PENDING_REVIEW, response.getRefundStatus());

        verify(reservationRefundRepository, times(1)).save(argThat(r ->
                r.getRefundAmount() == null &&
                r.getCompanyRetainedAmount() == null &&
                r.getRefundStatus() == RefundStatus.PENDING_REVIEW &&
                r.getReason().equals("Family emergency") &&
                r.getRequestedAt() != null
        ));
    }

    @Test
    void testReservationStatusChangesCorrectly() {
        LocalDateTime paymentTime = LocalDateTime.of(2026, 10, 5, 10, 0, 0);
        Reservation reservation = createConfirmedReservation(81L, new BigDecimal("2500000"));
        Payment payment = createVerifiedPayment(reservation, paymentTime);

        when(reservationRepository.findById(81L)).thenReturn(Optional.of(reservation));
        when(paymentRepository.findByReservationId(81L)).thenReturn(List.of(payment));
        when(reservationRefundRepository.existsByReservationId(81L)).thenReturn(false);
        when(saleRepository.findByApartmentId(1L)).thenReturn(Optional.empty());
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(availableApartment));
        when(reservationRepository.existsByApartmentIdAndStatusIn(eq(1L), any())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reservationRefundRepository.save(any(ReservationRefund.class))).thenAnswer(inv -> inv.getArgument(0));

        Instant currentInstant = paymentTime.plusHours(5).atZone(ZoneId.systemDefault()).toInstant();
        reservationService.setClock(Clock.fixed(currentInstant, ZoneId.systemDefault()));

        assertEquals(ReservationStatus.CONFIRMED, reservation.getStatus());
        reservationService.cancelReservationWithRefund(81L, null, customerPrincipal);

        assertEquals(ReservationStatus.CANCELLED, reservation.getStatus());
        verify(reservationRepository, times(1)).save(argThat(r -> r.getStatus() == ReservationStatus.CANCELLED));
    }

    @Test
    void testApartmentAvailabilityRestoredCorrectly() {
        LocalDateTime paymentTime = LocalDateTime.of(2026, 10, 5, 10, 0, 0);
        Reservation reservation = createConfirmedReservation(82L, new BigDecimal("2500000"));
        Payment payment = createVerifiedPayment(reservation, paymentTime);

        availableApartment.setStatus(ApartmentStatus.RESERVED);

        when(reservationRepository.findById(82L)).thenReturn(Optional.of(reservation));
        when(paymentRepository.findByReservationId(82L)).thenReturn(List.of(payment));
        when(reservationRefundRepository.existsByReservationId(82L)).thenReturn(false);
        when(saleRepository.findByApartmentId(1L)).thenReturn(Optional.empty());
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(availableApartment));
        when(reservationRepository.existsByApartmentIdAndStatusIn(eq(1L), any())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reservationRefundRepository.save(any(ReservationRefund.class))).thenAnswer(inv -> inv.getArgument(0));

        Instant currentInstant = paymentTime.plusHours(10).atZone(ZoneId.systemDefault()).toInstant();
        reservationService.setClock(Clock.fixed(currentInstant, ZoneId.systemDefault()));

        reservationService.cancelReservationWithRefund(82L, null, customerPrincipal);

        assertEquals(ApartmentStatus.AVAILABLE, availableApartment.getStatus());
        verify(apartmentRepository, times(1)).save(availableApartment);
    }

    @Test
    void testRollbackIfRefundCreationFailsMidway() {
        LocalDateTime paymentTime = LocalDateTime.of(2026, 10, 5, 10, 0, 0);
        Reservation reservation = createConfirmedReservation(83L, new BigDecimal("2500000"));
        Payment payment = createVerifiedPayment(reservation, paymentTime);

        when(reservationRepository.findById(83L)).thenReturn(Optional.of(reservation));
        when(paymentRepository.findByReservationId(83L)).thenReturn(List.of(payment));
        when(reservationRefundRepository.existsByReservationId(83L)).thenReturn(false);
        when(saleRepository.findByApartmentId(1L)).thenReturn(Optional.empty());
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(availableApartment));
        when(reservationRepository.existsByApartmentIdAndStatusIn(eq(1L), any())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        // Simulate database crash during refund save
        when(reservationRefundRepository.save(any(ReservationRefund.class)))
                .thenThrow(new RuntimeException("Simulated database failure during refund record creation"));

        Instant currentInstant = paymentTime.plusHours(1).atZone(ZoneId.systemDefault()).toInstant();
        reservationService.setClock(Clock.fixed(currentInstant, ZoneId.systemDefault()));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                reservationService.cancelReservationWithRefund(83L, null, customerPrincipal)
        );

        assertEquals("Simulated database failure during refund record creation", ex.getMessage());
        verify(notificationSubject, never()).notifyObservers(any());
    }

    @Test
    void testCustomerCannotSetRetainedAmount() {
        LocalDateTime paymentTime = LocalDateTime.of(2026, 10, 5, 10, 0, 0);
        Reservation reservation = createConfirmedReservation(84L, new BigDecimal("2250000"));
        Payment payment = createVerifiedPayment(reservation, paymentTime);

        when(reservationRepository.findById(84L)).thenReturn(Optional.of(reservation));
        when(paymentRepository.findByReservationId(84L)).thenReturn(List.of(payment));
        when(reservationRefundRepository.existsByReservationId(84L)).thenReturn(false);
        when(saleRepository.findByApartmentId(1L)).thenReturn(Optional.empty());
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(availableApartment));
        when(reservationRepository.existsByApartmentIdAndStatusIn(eq(1L), any())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reservationRefundRepository.save(any(ReservationRefund.class))).thenAnswer(inv -> inv.getArgument(0));

        Instant currentInstant = paymentTime.plusHours(5).atZone(ZoneId.systemDefault()).toInstant();
        reservationService.setClock(Clock.fixed(currentInstant, ZoneId.systemDefault()));

        // Customer passes arbitrary amounts in request
        com.skyline.dto.reservation.ReservationCancellationRequest rogueRequest =
                new com.skyline.dto.reservation.ReservationCancellationRequest(
                        new BigDecimal("2250000"), BigDecimal.ZERO, "Rogue customer input", null
                );

        ReservationRefundResponse response = reservationService.cancelReservationWithRefund(84L, rogueRequest, customerPrincipal);

        // Backend must ignore customer-provided amounts and set them to null/pending review
        assertNull(response.getRefundAmount());
        assertNull(response.getCompanyRetainedAmount());
        assertEquals(RefundStatus.PENDING_REVIEW, response.getRefundStatus());
    }

    @Test
    void testCustomerCannotReviewOrCompleteRefund() {
        RefundSettlementRequest settlementReq = new RefundSettlementRequest(new BigDecimal("250000"), "test");
        assertThrows(ForbiddenException.class, () ->
                reservationService.reviewAndApproveSettlement(901L, settlementReq, customerPrincipal)
        );

        RecordRefundPaymentRequest paymentReq = new RecordRefundPaymentRequest("Bank Transfer", "TXN-1", null, null, null);
        assertThrows(ForbiddenException.class, () ->
                reservationService.recordRefundPayment(901L, paymentReq, customerPrincipal)
        );
    }

    @Test
    void testSettlementOriginal2250kRetained250kCalculatesRefund2000k() {
        Reservation refRes = createConfirmedReservation(801L, new BigDecimal("2250000"));
        ReservationRefund refund = ReservationRefund.builder()
                .id(101L)
                .reservation(refRes)
                .customer(customer)
                .apartment(availableApartment)
                .originalFee(new BigDecimal("2250000"))
                .refundStatus(RefundStatus.PENDING_REVIEW)
                .initiatedByRole("CUSTOMER")
                .build();

        when(reservationRefundRepository.findById(101L)).thenReturn(Optional.of(refund));
        when(reservationRefundRepository.save(any(ReservationRefund.class))).thenAnswer(inv -> inv.getArgument(0));

        RefundSettlementRequest request = new RefundSettlementRequest(new BigDecimal("250000"), "Standard deduction");

        ReservationRefundResponse response = reservationService.reviewAndApproveSettlement(101L, request, staffPrincipal);

        assertNotNull(response);
        assertEquals(new BigDecimal("250000"), response.getCompanyRetainedAmount());
        assertEquals(new BigDecimal("2000000"), response.getRefundAmount());
        assertEquals(RefundStatus.PENDING_PAYMENT, response.getRefundStatus());
        assertEquals("Staff Member", response.getReviewedBy());
        assertNotNull(response.getReviewedAt());
        assertEquals("Standard deduction", response.getSettlementNote());
    }

    @Test
    void testSettlementRetainedZeroCalculatesFullRefund() {
        Reservation refRes = createConfirmedReservation(802L, new BigDecimal("2250000"));
        ReservationRefund refund = ReservationRefund.builder()
                .id(102L)
                .reservation(refRes)
                .customer(customer)
                .apartment(availableApartment)
                .originalFee(new BigDecimal("2250000"))
                .refundStatus(RefundStatus.PENDING_REVIEW)
                .build();

        when(reservationRefundRepository.findById(102L)).thenReturn(Optional.of(refund));
        when(reservationRefundRepository.save(any(ReservationRefund.class))).thenAnswer(inv -> inv.getArgument(0));

        RefundSettlementRequest request = new RefundSettlementRequest(BigDecimal.ZERO, "Full refund approved");

        ReservationRefundResponse response = reservationService.reviewAndApproveSettlement(102L, request, staffPrincipal);

        assertEquals(BigDecimal.ZERO, response.getCompanyRetainedAmount());
        assertEquals(new BigDecimal("2250000"), response.getRefundAmount());
        assertEquals(RefundStatus.PENDING_PAYMENT, response.getRefundStatus());
    }

    @Test
    void testSettlementRetainedOriginalCalculatesZeroRefund() {
        Reservation refRes = createConfirmedReservation(803L, new BigDecimal("2250000"));
        ReservationRefund refund = ReservationRefund.builder()
                .id(103L)
                .reservation(refRes)
                .customer(customer)
                .apartment(availableApartment)
                .originalFee(new BigDecimal("2250000"))
                .refundStatus(RefundStatus.PENDING_REVIEW)
                .build();

        when(reservationRefundRepository.findById(103L)).thenReturn(Optional.of(refund));
        when(reservationRefundRepository.save(any(ReservationRefund.class))).thenAnswer(inv -> inv.getArgument(0));

        RefundSettlementRequest request = new RefundSettlementRequest(new BigDecimal("2250000"), "Company retains 100%");

        ReservationRefundResponse response = reservationService.reviewAndApproveSettlement(103L, request, adminPrincipal);

        assertEquals(new BigDecimal("2250000"), response.getCompanyRetainedAmount());
        assertEquals(BigDecimal.ZERO, response.getRefundAmount());
        assertEquals(RefundStatus.PENDING_PAYMENT, response.getRefundStatus());
    }

    @Test
    void testSettlementRetainedGreaterThanOriginalRejected() {
        Reservation refRes = createConfirmedReservation(804L, new BigDecimal("2250000"));
        ReservationRefund refund = ReservationRefund.builder()
                .id(104L)
                .reservation(refRes)
                .customer(customer)
                .apartment(availableApartment)
                .originalFee(new BigDecimal("2250000"))
                .refundStatus(RefundStatus.PENDING_REVIEW)
                .build();

        when(reservationRefundRepository.findById(104L)).thenReturn(Optional.of(refund));

        RefundSettlementRequest request = new RefundSettlementRequest(new BigDecimal("3000000"), "Over-retention attempt");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                reservationService.reviewAndApproveSettlement(104L, request, adminPrincipal)
        );

        assertTrue(ex.getMessage().contains("cannot exceed original reservation fee"));
        verify(reservationRefundRepository, never()).save(any());
    }

    @Test
    void testSettlementRetainedNegativeRejected() {
        Reservation refRes = createConfirmedReservation(805L, new BigDecimal("2250000"));
        ReservationRefund refund = ReservationRefund.builder()
                .id(105L)
                .reservation(refRes)
                .customer(customer)
                .apartment(availableApartment)
                .originalFee(new BigDecimal("2250000"))
                .refundStatus(RefundStatus.PENDING_REVIEW)
                .build();

        when(reservationRefundRepository.findById(105L)).thenReturn(Optional.of(refund));

        RefundSettlementRequest request = new RefundSettlementRequest(new BigDecimal("-50000"), "Negative retention");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                reservationService.reviewAndApproveSettlement(105L, request, staffPrincipal)
        );

        assertTrue(ex.getMessage().contains("cannot be negative"));
        verify(reservationRefundRepository, never()).save(any());
    }

    @Test
    void testManagementCancellationForcesRetainedZeroAndFullRefundDue() {
        Reservation reservation = createConfirmedReservation(85L, new BigDecimal("2250000"));
        Payment payment = createVerifiedPayment(reservation, LocalDateTime.now().minusDays(1));

        when(reservationRepository.findById(85L)).thenReturn(Optional.of(reservation));
        when(paymentRepository.findByReservationId(85L)).thenReturn(List.of(payment));
        when(reservationRefundRepository.existsByReservationId(85L)).thenReturn(false);
        when(saleRepository.findByApartmentId(1L)).thenReturn(Optional.empty());
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(availableApartment));
        when(reservationRepository.existsByApartmentIdAndStatusIn(eq(1L), any())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reservationRefundRepository.save(any(ReservationRefund.class))).thenAnswer(inv -> inv.getArgument(0));

        // Staff initiates cancellation with request
        com.skyline.dto.reservation.ReservationCancellationRequest request =
                new com.skyline.dto.reservation.ReservationCancellationRequest(
                        new BigDecimal("1000000"), new BigDecimal("1250000"), "Management cancelled", "Staff note"
                );

        ReservationRefundResponse response = reservationService.cancelReservationWithRefund(85L, request, staffPrincipal);

        assertNotNull(response);
        assertEquals(BigDecimal.ZERO, response.getCompanyRetainedAmount());
        assertEquals(new BigDecimal("2250000"), response.getRefundAmount());
        assertEquals("STAFF", response.getInitiatedByRole());
        assertEquals(RefundStatus.PENDING_PAYMENT, response.getRefundStatus());
    }

    @Test
    void testRecordRefundPaymentCompletesRefundWithAuditData() {
        Reservation refRes = createConfirmedReservation(806L, new BigDecimal("2250000"));
        ReservationRefund refund = ReservationRefund.builder()
                .id(106L)
                .reservation(refRes)
                .customer(customer)
                .apartment(availableApartment)
                .originalFee(new BigDecimal("2250000"))
                .refundAmount(new BigDecimal("2000000"))
                .companyRetainedAmount(new BigDecimal("250000"))
                .refundStatus(RefundStatus.PENDING_PAYMENT)
                .build();

        when(reservationRefundRepository.findById(106L)).thenReturn(Optional.of(refund));
        when(reservationRefundRepository.save(any(ReservationRefund.class))).thenAnswer(inv -> inv.getArgument(0));

        RecordRefundPaymentRequest paymentRequest = new RecordRefundPaymentRequest(
                "Bank Transfer", "TXN-998811", "Transferred to Commercial Bank", null, null
        );

        ReservationRefundResponse response = reservationService.recordRefundPayment(106L, paymentRequest, staffPrincipal);

        assertNotNull(response);
        assertEquals(RefundStatus.COMPLETED, response.getRefundStatus());
        assertEquals("Staff Member", response.getProcessedBy());
        assertNotNull(response.getProcessedAt());
        assertEquals("Bank Transfer", response.getRefundMethod());
        assertEquals("TXN-998811", response.getTransactionReference());
    }

    @Test
    void testRefundCannotBeCompletedTwice() {
        Reservation refRes = createConfirmedReservation(807L, new BigDecimal("2250000"));
        ReservationRefund completedRefund = ReservationRefund.builder()
                .id(107L)
                .reservation(refRes)
                .customer(customer)
                .apartment(availableApartment)
                .originalFee(new BigDecimal("2250000"))
                .refundAmount(new BigDecimal("2000000"))
                .refundStatus(RefundStatus.COMPLETED)
                .build();

        when(reservationRefundRepository.findById(107L)).thenReturn(Optional.of(completedRefund));

        RecordRefundPaymentRequest paymentRequest = new RecordRefundPaymentRequest(
                "Cash", "REF-002", "Second payment attempt", null, null
        );

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                reservationService.recordRefundPayment(107L, paymentRequest, staffPrincipal)
        );

        assertTrue(ex.getMessage().contains("already been completed"));
        verify(reservationRefundRepository, never()).save(completedRefund);
    }

    @Test
    void testCompletedSettlementCannotBeEdited() {
        Reservation refRes = createConfirmedReservation(808L, new BigDecimal("2250000"));
        ReservationRefund completedRefund = ReservationRefund.builder()
                .id(108L)
                .reservation(refRes)
                .customer(customer)
                .apartment(availableApartment)
                .originalFee(new BigDecimal("2250000"))
                .refundStatus(RefundStatus.COMPLETED)
                .build();

        when(reservationRefundRepository.findById(108L)).thenReturn(Optional.of(completedRefund));

        RefundSettlementRequest settlementReq = new RefundSettlementRequest(new BigDecimal("500000"), "Tamper attempt");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                reservationService.reviewAndApproveSettlement(108L, settlementReq, adminPrincipal)
        );

        assertTrue(ex.getMessage().contains("already been completed"));
        verify(reservationRefundRepository, never()).save(completedRefund);
    }
}
