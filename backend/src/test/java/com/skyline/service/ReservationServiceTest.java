package com.skyline.service;

import com.skyline.dto.reservation.ReservationRequest;
import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Reservation;
import com.skyline.entity.User;
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
                reservationRepository, apartmentRepository, appointmentRepository, userService, notificationService);

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
        when(appointmentRepository.existsByApartmentIdAndCustomerIdAndStatusIn(any(), any(), any())).thenReturn(true);

        ReservationRequest request = new ReservationRequest("APT-001", new BigDecimal("500000"), null, null);

        assertThrows(ConflictException.class, () -> reservationService.createReservation(customerPrincipal, request));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void testCannotReserveWithoutEligibleViewing() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(availableApartment));
        when(appointmentRepository.existsByApartmentIdAndCustomerIdAndStatusIn(any(), any(), any())).thenReturn(false);

        ReservationRequest request = new ReservationRequest("APT-001", new BigDecimal("500000"), null, null);

        assertThrows(BadRequestException.class, () -> reservationService.createReservation(customerPrincipal, request));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void testDuplicateActiveReservationPrevented() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(availableApartment));
        when(appointmentRepository.existsByApartmentIdAndCustomerIdAndStatusIn(any(), any(), any())).thenReturn(true);
        when(reservationRepository.existsByApartmentIdAndStatusIn(eq(1L), any())).thenReturn(true);

        ReservationRequest request = new ReservationRequest("APT-001", new BigDecimal("500000"), null, null);

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
        when(reservationRepository.existsByApartmentIdAndStatusIn(eq(2L), any())).thenReturn(false);

        reservationService.expireOverdueReservations();

        assertEquals(ReservationStatus.EXPIRED, expiredReservation.getStatus());
        assertEquals(ApartmentStatus.AVAILABLE, reservedApartment.getStatus());
        verify(apartmentRepository).save(reservedApartment);
        verify(reservationRepository).save(expiredReservation);
    }
}
