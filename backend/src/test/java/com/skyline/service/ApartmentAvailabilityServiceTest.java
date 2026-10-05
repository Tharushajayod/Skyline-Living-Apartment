package com.skyline.service;

import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Sale;
import com.skyline.entity.User;
import com.skyline.enums.ReservationStatus;
import com.skyline.enums.UserRole;
import com.skyline.enums.UserStatus;
import com.skyline.exception.ConflictException;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.ReservationRepository;
import com.skyline.repository.SaleRepository;
import com.skyline.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApartmentAvailabilityServiceTest {

    @Mock
    private ApartmentRepository apartmentRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private SaleRepository saleRepository;

    private ApartmentAvailabilityService availabilityService;

    private Apartment testApartment;
    private User buyer;
    private User otherCustomer;
    private User admin;
    private UserPrincipal buyerPrincipal;
    private UserPrincipal otherCustomerPrincipal;
    private UserPrincipal adminPrincipal;

    @BeforeEach
    void setUp() {
        availabilityService = new ApartmentAvailabilityService(apartmentRepository, reservationRepository, saleRepository);

        testApartment = Apartment.builder()
                .id(10L)
                .title("Skyline Suite 10")
                .apartmentNumber("APT-010")
                .status(ApartmentStatus.AVAILABLE)
                .price(new BigDecimal("20000000"))
                .build();

        buyer = User.builder()
                .id(101L)
                .name("Alice Buyer")
                .email("alice@test.com")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();
        buyerPrincipal = new UserPrincipal(buyer);

        otherCustomer = User.builder()
                .id(102L)
                .name("Bob Stranger")
                .email("bob@test.com")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();
        otherCustomerPrincipal = new UserPrincipal(otherCustomer);

        admin = User.builder()
                .id(1L)
                .name("Admin")
                .email("admin@skyline.com")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();
        adminPrincipal = new UserPrincipal(admin);
    }

    @Test
    void testMarkReservedSuccess() {
        availabilityService.markReserved(testApartment);

        assertEquals(ApartmentStatus.RESERVED, testApartment.getStatus());
        verify(apartmentRepository).save(testApartment);
    }

    @Test
    void testMarkReservedFailsIfAlreadySold() {
        testApartment.setStatus(ApartmentStatus.SOLD);
        assertThrows(ConflictException.class, () -> availabilityService.markReserved(testApartment));
        verify(apartmentRepository, never()).save(any());
    }

    @Test
    void testMarkSoldSuccess() {
        availabilityService.markSold(testApartment);

        assertEquals(ApartmentStatus.SOLD, testApartment.getStatus());
        verify(apartmentRepository).save(testApartment);
    }

    @Test
    void testUpdateApartmentAvailabilityAfterReservationChangeRestoresAvailable() {
        testApartment.setStatus(ApartmentStatus.RESERVED);
        when(apartmentRepository.findById(10L)).thenReturn(Optional.of(testApartment));
        when(saleRepository.findByApartmentId(10L)).thenReturn(Optional.empty());
        when(reservationRepository.existsByApartmentIdAndStatusIn(eq(10L), any())).thenReturn(false);

        availabilityService.updateApartmentAvailabilityAfterReservationChange(10L);

        assertEquals(ApartmentStatus.AVAILABLE, testApartment.getStatus());
        verify(apartmentRepository).save(testApartment);
    }

    @Test
    void testUpdateApartmentAvailabilityDoesNotRestoreIfOtherActiveReservationExists() {
        testApartment.setStatus(ApartmentStatus.RESERVED);
        when(apartmentRepository.findById(10L)).thenReturn(Optional.of(testApartment));
        when(saleRepository.findByApartmentId(10L)).thenReturn(Optional.empty());
        when(reservationRepository.existsByApartmentIdAndStatusIn(eq(10L), any())).thenReturn(true);

        availabilityService.updateApartmentAvailabilityAfterReservationChange(10L);

        assertEquals(ApartmentStatus.RESERVED, testApartment.getStatus());
        verify(apartmentRepository).save(testApartment);
    }

    @Test
    void testSoldApartmentNeverBecomesAvailableOnReservationChange() {
        testApartment.setStatus(ApartmentStatus.SOLD);
        when(apartmentRepository.findById(10L)).thenReturn(Optional.of(testApartment));

        availabilityService.updateApartmentAvailabilityAfterReservationChange(10L);

        assertEquals(ApartmentStatus.SOLD, testApartment.getStatus());
        verify(apartmentRepository, never()).save(any());
    }

    @Test
    void testSaleRecordPreventsRevertingToAvailable() {
        testApartment.setStatus(ApartmentStatus.RESERVED);
        Sale sale = Sale.builder().id(99L).apartment(testApartment).customer(buyer).build();

        when(apartmentRepository.findById(10L)).thenReturn(Optional.of(testApartment));
        when(saleRepository.findByApartmentId(10L)).thenReturn(Optional.of(sale));

        availabilityService.updateApartmentAvailabilityAfterReservationChange(10L);

        assertEquals(ApartmentStatus.SOLD, testApartment.getStatus());
        verify(apartmentRepository).save(testApartment);
    }

    @Test
    void testAccessControlUnsoldApartmentIsAccessibleToAll() {
        testApartment.setStatus(ApartmentStatus.AVAILABLE);
        when(saleRepository.findByApartmentId(10L)).thenReturn(Optional.empty());

        assertTrue(availabilityService.canCustomerAccessApartment(testApartment, null));
        assertTrue(availabilityService.canCustomerAccessApartment(testApartment, otherCustomerPrincipal));
        assertTrue(availabilityService.canCustomerAccessApartment(testApartment, buyerPrincipal));
    }

    @Test
    void testAccessControlSoldApartmentVisibilityRules() {
        testApartment.setStatus(ApartmentStatus.SOLD);
        Sale sale = Sale.builder()
                .id(1L)
                .apartment(testApartment)
                .customer(buyer)
                .customerEmail("alice@test.com")
                .build();
        when(saleRepository.findByApartmentId(10L)).thenReturn(Optional.of(sale));

        // Anonymous user -> hidden (false)
        assertFalse(availabilityService.canCustomerAccessApartment(testApartment, null));

        // Other customer -> hidden (false)
        assertFalse(availabilityService.canCustomerAccessApartment(testApartment, otherCustomerPrincipal));

        // Buyer who purchased -> visible (true)
        assertTrue(availabilityService.canCustomerAccessApartment(testApartment, buyerPrincipal));

        // Staff / Admin -> visible (true)
        assertTrue(availabilityService.canCustomerAccessApartment(testApartment, adminPrincipal));
    }
}
