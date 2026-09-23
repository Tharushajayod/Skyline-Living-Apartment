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
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

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
    private com.skyline.repository.OwnershipRecordRepository ownershipRecordRepository;

    @Mock
    private UserService userService;

    @Mock
    private NotificationService notificationService;

    private ReservationService reservationService;

    private User customer;
    private UserPrincipal customerPrincipal;
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
                ownershipRecordRepository,
                userService,
                notificationService
        );

        customer = User.builder()
                .id(10L)
                .name("Sarah Chen")
                .email("sarah.chen@email.com")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();

        customerPrincipal = new UserPrincipal(customer);

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
        when(paymentPlanRepository.existsByReservationIdAndStatusIn(eq(61L), any())).thenReturn(true);

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
}
