package com.skyline.strategy.payment;

import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Payment;
import com.skyline.entity.PaymentPlan;
import com.skyline.entity.PaymentPlanItem;
import com.skyline.entity.Reservation;
import com.skyline.entity.Sale;
import com.skyline.entity.User;
import com.skyline.enums.PaymentPlanItemStatus;
import com.skyline.enums.PaymentPlanStatus;
import com.skyline.enums.PaymentStatus;
import com.skyline.enums.PaymentType;
import com.skyline.enums.ReservationStatus;
import com.skyline.enums.UserRole;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.PaymentPlanItemRepository;
import com.skyline.repository.PaymentPlanRepository;
import com.skyline.repository.PaymentRepository;
import com.skyline.repository.ReservationRepository;
import com.skyline.repository.SaleRepository;
import com.skyline.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentVerificationStrategyTest {

    @Mock
    private ApartmentRepository apartmentRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private SaleRepository saleRepository;
    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private PaymentPlanRepository paymentPlanRepository;
    @Mock
    private PaymentPlanItemRepository paymentPlanItemRepository;

    private ReservationFeeVerificationStrategy reservationFeeStrategy;
    private FullPaymentVerificationStrategy fullPaymentStrategy;
    private InstallmentPaymentVerificationStrategy installmentStrategy;
    private PartPaymentVerificationStrategy partPaymentStrategy;
    private PaymentVerificationContext context;

    private User customer;
    private User staff;
    private UserPrincipal staffPrincipal;
    private Apartment apartment;
    private Reservation reservation;

    @BeforeEach
    void setUp() {
        reservationFeeStrategy = new ReservationFeeVerificationStrategy(
                apartmentRepository, paymentRepository, saleRepository, reservationRepository);

        fullPaymentStrategy = new FullPaymentVerificationStrategy(
                apartmentRepository, paymentRepository, saleRepository, paymentPlanRepository);

        installmentStrategy = new InstallmentPaymentVerificationStrategy(
                apartmentRepository, paymentRepository, saleRepository, paymentPlanRepository, paymentPlanItemRepository);

        partPaymentStrategy = new PartPaymentVerificationStrategy(
                apartmentRepository, paymentRepository, saleRepository, paymentPlanRepository, paymentPlanItemRepository);

        context = new PaymentVerificationContext(Arrays.asList(
                reservationFeeStrategy, fullPaymentStrategy, installmentStrategy, partPaymentStrategy));

        customer = User.builder().id(1L).name("David Perera").email("david@gmail.com").role(UserRole.CUSTOMER).build();
        staff = User.builder().id(2L).name("Finance Officer").email("staff@skyline.com").role(UserRole.STAFF).build();
        staffPrincipal = new UserPrincipal(staff);

        apartment = Apartment.builder()
                .id(100L)
                .title("Ocean Vista 10A")
                .price(new BigDecimal("25000000"))
                .status(ApartmentStatus.AVAILABLE)
                .build();

        reservation = Reservation.builder()
                .id(200L)
                .customer(customer)
                .apartment(apartment)
                .status(ReservationStatus.PENDING)
                .reservationFee(new BigDecimal("2500000"))
                .build();
    }

    @Test
    @DisplayName("Strategy Pattern: ReservationFeeVerificationStrategy confirms reservation on verification")
    void testReservationFeeStrategyConfirmsReservation() {
        Payment payment = Payment.builder()
                .id(501L)
                .type(PaymentType.RESERVATION_FEE)
                .amount(new BigDecimal("2500000"))
                .status(PaymentStatus.VERIFIED)
                .reservation(reservation)
                .apartment(apartment)
                .customer(customer)
                .build();

        when(paymentRepository.sumAmountByReservationAndStatus(reservation.getId(), PaymentStatus.VERIFIED))
                .thenReturn(new BigDecimal("2500000"));

        assertTrue(reservationFeeStrategy.supports(PaymentType.RESERVATION_FEE));
        reservationFeeStrategy.executePostVerification(payment, staffPrincipal, "Finance Officer");

        assertEquals(ReservationStatus.CONFIRMED, reservation.getStatus());
        verify(reservationRepository, times(1)).save(reservation);
        // Reservation fee is 10%, apartment should NOT be marked SOLD
        verify(apartmentRepository, never()).save(apartment);
    }

    @Test
    @DisplayName("Strategy Pattern: FullPaymentVerificationStrategy marks apartment SOLD and creates Sale record")
    void testFullPaymentStrategyMarksSoldAndCreatesSale() {
        Payment payment = Payment.builder()
                .id(502L)
                .type(PaymentType.FULL_PAYMENT)
                .amount(new BigDecimal("25000000"))
                .status(PaymentStatus.VERIFIED)
                .apartment(apartment)
                .customer(customer)
                .reservation(reservation)
                .build();

        when(saleRepository.findByApartmentId(100L)).thenReturn(Optional.empty());

        assertTrue(fullPaymentStrategy.supports(PaymentType.FULL_PAYMENT));
        fullPaymentStrategy.executePostVerification(payment, staffPrincipal, "Finance Officer");

        assertEquals(ApartmentStatus.SOLD, apartment.getStatus());
        verify(apartmentRepository, times(1)).save(apartment);

        ArgumentCaptor<Sale> saleCaptor = ArgumentCaptor.forClass(Sale.class);
        verify(saleRepository, times(1)).save(saleCaptor.capture());
        Sale createdSale = saleCaptor.getValue();
        assertEquals("Ocean Vista 10A", createdSale.getApartmentTitle());
        assertEquals(new BigDecimal("25000000"), createdSale.getFinalPrice());
        assertEquals("Deed Transferred", createdSale.getOwnershipStatus());
    }

    @Test
    @DisplayName("Strategy Pattern: InstallmentPaymentVerificationStrategy reconciles plan schedule and item")
    void testInstallmentPaymentStrategyReconcilesPlan() {
        PaymentPlan plan = PaymentPlan.builder()
                .id(300L)
                .totalPlanAmount(new BigDecimal("22500000"))
                .remainingAmount(new BigDecimal("10000000"))
                .status(PaymentPlanStatus.APPROVED)
                .build();

        PaymentPlanItem planItem = PaymentPlanItem.builder()
                .id(401L)
                .paymentPlan(plan)
                .sequenceNo(2)
                .amount(new BigDecimal("5000000"))
                .status(PaymentPlanItemStatus.PENDING_VERIFICATION)
                .build();

        Payment payment = Payment.builder()
                .id(503L)
                .type(PaymentType.INSTALLMENT)
                .amount(new BigDecimal("5000000"))
                .status(PaymentStatus.VERIFIED)
                .apartment(apartment)
                .customer(customer)
                .paymentPlan(plan)
                .paymentPlanItem(planItem)
                .build();

        when(paymentRepository.sumAmountByApartmentAndStatus(100L, PaymentStatus.VERIFIED))
                .thenReturn(new BigDecimal("20000000")); // still 5,000,000 remaining

        assertTrue(installmentStrategy.supports(PaymentType.INSTALLMENT));
        installmentStrategy.executePostVerification(payment, staffPrincipal, "Finance Officer");

        assertEquals(new BigDecimal("5000000"), plan.getRemainingAmount());
        assertEquals(PaymentPlanItemStatus.PAID, planItem.getStatus());
        verify(paymentPlanRepository, times(1)).save(plan);
        verify(paymentPlanItemRepository, times(1)).save(planItem);
        // Not completely paid, apartment remains AVAILABLE
        verify(apartmentRepository, never()).save(apartment);
    }

    @Test
    @DisplayName("Strategy Pattern: PaymentVerificationContext routes verification dynamically to correct Strategy")
    void testContextRoutesDynamically() {
        Payment payment = Payment.builder()
                .id(504L)
                .type(PaymentType.RESERVATION_FEE)
                .amount(new BigDecimal("2500000"))
                .status(PaymentStatus.VERIFIED)
                .reservation(reservation)
                .apartment(apartment)
                .customer(customer)
                .build();

        when(paymentRepository.sumAmountByReservationAndStatus(reservation.getId(), PaymentStatus.VERIFIED))
                .thenReturn(new BigDecimal("2500000"));

        context.executePostVerification(payment, staffPrincipal, "Finance Officer");

        assertEquals(ReservationStatus.CONFIRMED, reservation.getStatus());
        verify(reservationRepository, times(1)).save(reservation);
    }
}
