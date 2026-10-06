package com.skyline.decorator.sale;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.skyline.dto.sale.SaleDetailsResponse;
import com.skyline.entity.Apartment;
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
import com.skyline.enums.UserRole;
import com.skyline.repository.PaymentPlanItemRepository;
import com.skyline.repository.PaymentPlanRepository;
import com.skyline.repository.PaymentRepository;

@ExtendWith(MockitoExtension.class)
class SaleStatementDecoratorTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private PaymentPlanRepository paymentPlanRepository;
    @Mock
    private PaymentPlanItemRepository paymentPlanItemRepository;

    private User customer;
    private Apartment apartment;
    private Reservation reservation;
    private Sale sale;

    @BeforeEach
    void setUp() {
        customer = User.builder().id(10L).name("Kasun Dias").email("kasun@gmail.com").role(UserRole.CUSTOMER).build();
        apartment = Apartment.builder().id(20L).title("Penthouse 3001").price(new BigDecimal("30000000")).build();
        reservation = Reservation.builder().id(30L).customer(customer).apartment(apartment).build();

        sale = Sale.builder()
                .id(1L)
                .apartment(apartment)
                .customer(customer)
                .reservation(reservation)
                .apartmentTitle("Penthouse 3001")
                .finalPrice(new BigDecimal("30000000"))
                .saleDate(LocalDate.now())
                .ownershipDate(LocalDate.now())
                .ownershipStatus("Deed Transferred")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Decorator Pattern: BasicSaleStatement generates foundational sale statement without decorators")
    void testBasicSaleStatement() {
        SaleStatementComponent component = new BasicSaleStatement(sale);
        SaleDetailsResponse response = component.generateStatement();

        assertNotNull(response);
        assertNotNull(response.getSale());
        assertEquals("SAL-001", response.getSale().getId());
        assertEquals("Penthouse 3001", response.getApartment().getTitle());
        assertEquals("Kasun Dias", response.getCustomer().getName());
        assertNull(response.getPaymentSummary(), "Base component should not contain payment summary");
        assertNull(response.getPayments(), "Base component should not contain payments list");
        assertNull(response.getPaymentPlan(), "Base component should not contain payment plan");
    }

    @Test
    @DisplayName("Decorator Pattern: PaymentSummaryDecorator enriches statement with financial aggregation")
    void testPaymentSummaryDecorator() {
        SaleStatementComponent base = new BasicSaleStatement(sale);

        Payment verifiedPayment = Payment.builder()
                .id(101L)
                .amount(new BigDecimal("10000000"))
                .status(PaymentStatus.VERIFIED)
                .type(PaymentType.PART_PAYMENT)
                .uploadedAt(LocalDateTime.now())
                .build();

        when(paymentRepository.findByApartmentId(20L)).thenReturn(Collections.singletonList(verifiedPayment));
        when(paymentRepository.findByReservationId(30L)).thenReturn(Collections.emptyList());

        SaleStatementComponent decorated = new PaymentSummaryDecorator(base, sale, paymentRepository);
        SaleDetailsResponse response = decorated.generateStatement();

        assertNotNull(response);
        assertNotNull(response.getSale());
        assertNotNull(response.getPaymentSummary());
        assertEquals(new BigDecimal("30000000"), response.getPaymentSummary().getApartmentPrice());
        assertEquals(new BigDecimal("10000000"), response.getPaymentSummary().getTotalVerifiedPayments());
        assertEquals(new BigDecimal("20000000"), response.getPaymentSummary().getRemainingBalance());
        assertEquals(1, response.getPaymentSummary().getPaymentCount());
        assertEquals(1, response.getPayments().size());
        assertNull(response.getPaymentPlan(), "Payment plan remains un-decorated");
    }

    @Test
    @DisplayName("Decorator Pattern: Full Decorator chain attaches both Payment Summary and Payment Plan Schedule")
    void testFullDecoratorChain() {
        // Component
        SaleStatementComponent statement = new BasicSaleStatement(sale);

        // Decorator 1: Payment Summary
        Payment verifiedPayment = Payment.builder()
                .id(102L)
                .amount(new BigDecimal("30000000"))
                .status(PaymentStatus.VERIFIED)
                .type(PaymentType.FULL_PAYMENT)
                .uploadedAt(LocalDateTime.now())
                .build();
        when(paymentRepository.findByApartmentId(20L)).thenReturn(Collections.singletonList(verifiedPayment));
        when(paymentRepository.findByReservationId(30L)).thenReturn(Collections.emptyList());
        statement = new PaymentSummaryDecorator(statement, sale, paymentRepository);

        // Decorator 2: Payment Plan Schedule
        PaymentPlan plan = PaymentPlan.builder()
                .id(50L)
                .totalPlanAmount(new BigDecimal("30000000"))
                .remainingAmount(BigDecimal.ZERO)
                .status(PaymentPlanStatus.COMPLETED)
                .build();
        PaymentPlanItem item = PaymentPlanItem.builder()
                .id(60L)
                .sequenceNo(1)
                .amount(new BigDecimal("30000000"))
                .status(PaymentPlanItemStatus.PAID)
                .build();
        when(paymentPlanRepository.findByReservationIdOrderByCreatedAtDesc(30L))
                .thenReturn(Collections.singletonList(plan));
        when(paymentPlanItemRepository.findByPaymentPlanIdOrderBySequenceNoAsc(50L))
                .thenReturn(Collections.singletonList(item));
        statement = new PaymentPlanScheduleDecorator(statement, sale, paymentPlanRepository, paymentPlanItemRepository);

        // Execute Decorated Statement Generation
        SaleDetailsResponse fullStatement = statement.generateStatement();

        assertNotNull(fullStatement);
        assertNotNull(fullStatement.getSale());
        assertNotNull(fullStatement.getPaymentSummary());
        assertEquals(new BigDecimal("30000000"), fullStatement.getPaymentSummary().getTotalVerifiedPayments());
        assertEquals(BigDecimal.ZERO, fullStatement.getPaymentSummary().getRemainingBalance());
        assertNotNull(fullStatement.getPaymentPlan());
        assertEquals(1, fullStatement.getPaymentPlan().getItems().size());
        assertEquals(PaymentPlanItemStatus.PAID, fullStatement.getPaymentPlan().getItems().get(0).getStatus());
    }
}
