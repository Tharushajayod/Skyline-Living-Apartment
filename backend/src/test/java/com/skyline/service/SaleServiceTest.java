package com.skyline.service;

import com.skyline.dto.sale.SaleRequest;
import com.skyline.dto.sale.SaleResponse;
import com.skyline.entity.*;
import com.skyline.enums.ReservationStatus;
import com.skyline.enums.UserRole;
import com.skyline.enums.UserStatus;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.OwnershipRecordRepository;
import com.skyline.repository.ReservationRepository;
import com.skyline.repository.SaleRepository;
import com.skyline.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private OwnershipRecordRepository ownershipRecordRepository;

    @Mock
    private ApartmentRepository apartmentRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private com.skyline.repository.PaymentRepository paymentRepository;

    @Mock
    private com.skyline.repository.PaymentPlanRepository paymentPlanRepository;

    @Mock
    private com.skyline.repository.PaymentPlanItemRepository paymentPlanItemRepository;

    @Mock
    private UserService userService;

    @Mock
    private NotificationService notificationService;

    private SaleService saleService;

    @BeforeEach
    void setUp() {
        saleService = new SaleService(
                saleRepository,
                ownershipRecordRepository,
                apartmentRepository,
                reservationRepository,
                paymentRepository,
                paymentPlanRepository,
                paymentPlanItemRepository,
                userService,
                notificationService
        );
    }

    @Test
    void testCompletedSaleChangesApartmentToSoldAndCreatesOwnershipRecord() {
        User staff = User.builder()
                .id(2L)
                .name("Staff Member")
                .email("staff@skylineliving.com")
                .role(UserRole.STAFF)
                .status(UserStatus.ACTIVE)
                .build();
        UserPrincipal staffPrincipal = new UserPrincipal(staff);

        User customer = User.builder()
                .id(3L)
                .name("Customer Chen")
                .email("chen@email.com")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();

        Apartment apartment = Apartment.builder()
                .id(1L)
                .apartmentNumber("APT-001")
                .title("Skyline Penthouse")
                .status(ApartmentStatus.RESERVED)
                .price(new BigDecimal("28000000"))
                .build();

        Reservation reservation = Reservation.builder()
                .id(10L)
                .apartment(apartment)
                .customer(customer)
                .status(ReservationStatus.CONFIRMED)
                .reservationFee(new BigDecimal("500000"))
                .expiresAt(LocalDateTime.now().plusDays(2))
                .build();

        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> {
            Sale s = invocation.getArgument(0);
            s.setId(100L);
            return s;
        });

        SaleRequest request = new SaleRequest(
                "APT-001",
                "RSV-010",
                "Customer Chen",
                "chen@email.com",
                new BigDecimal("28000000"),
                LocalDate.now().toString()
        );

        SaleResponse response = saleService.finalizeSale(staffPrincipal, request);

        assertNotNull(response);
        assertEquals(ApartmentStatus.SOLD, apartment.getStatus());
        assertEquals(ReservationStatus.CONFIRMED, reservation.getStatus());

        verify(apartmentRepository).save(apartment);
        verify(saleRepository).save(any(Sale.class));
        verify(ownershipRecordRepository).save(argThat(rec ->
                rec.getApartment().equals(apartment) && rec.getCustomer().equals(customer)));
        verify(notificationService).createNotification(eq(customer), any(), anyString(), anyString());
    }
}
