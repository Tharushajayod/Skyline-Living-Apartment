package com.skyline.factory.reservation;

import com.skyline.dto.reservation.ReservationCancellationRequest;
import com.skyline.entity.Apartment;
import com.skyline.entity.Payment;
import com.skyline.entity.Reservation;
import com.skyline.entity.ReservationRefund;
import com.skyline.entity.User;
import com.skyline.enums.RefundStatus;
import com.skyline.enums.UserRole;
import com.skyline.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class ReservationRefundFactoryTest {

    private ReservationRefundFactory refundFactory;
    private Reservation reservation;
    private Payment payment;
    private User customer;
    private User staff;
    private UserPrincipal customerPrincipal;
    private UserPrincipal staffPrincipal;

    @BeforeEach
    void setUp() {
        refundFactory = new ReservationRefundFactoryImpl();

        customer = User.builder().id(101L).name("Sarah Chen").email("sarah@email.com").role(UserRole.CUSTOMER).build();
        staff = User.builder().id(201L).name("Admin User").email("admin@skyline.com").role(UserRole.ADMIN).build();
        customerPrincipal = new UserPrincipal(customer);
        staffPrincipal = new UserPrincipal(staff);

        Apartment apt = Apartment.builder().id(10L).title("Tower Unit 402").price(new BigDecimal("22500000")).build();
        reservation = Reservation.builder().id(301L).customer(customer).apartment(apt).reservationFee(new BigDecimal("2250000")).build();
        payment = Payment.builder().id(401L).amount(new BigDecimal("2250000")).customer(customer).apartment(apt).build();
    }

    @Test
    @DisplayName("Factory Pattern: Creates Customer Cancellation Refund product with PENDING_REVIEW and null retention")
    void testCreateCustomerCancellationRefund() {
        ReservationCancellationRequest request = ReservationCancellationRequest.builder()
                .reason("Change of investment plans")
                .notes("Commercial Bank AC 12345678")
                .build();

        ReservationRefund product = refundFactory.createCustomerCancellationRefund(
                reservation, payment, request, customerPrincipal, new BigDecimal("2250000"));

        assertNotNull(product);
        assertEquals(RefundStatus.PENDING_REVIEW, product.getRefundStatus());
        assertEquals("CUSTOMER", product.getInitiatedByRole());
        assertEquals(101L, product.getInitiatedByUserId());
        assertEquals(new BigDecimal("2250000"), product.getOriginalFee());
        assertNull(product.getCompanyRetainedAmount(), "Company retained fee must remain null pending review");
        assertEquals("Change of investment plans", product.getReason());
        assertEquals("Commercial Bank AC 12345678", product.getNotes());
    }

    @Test
    @DisplayName("Factory Pattern: Creates Management Cancellation Refund product with 100% full refund and PENDING_PAYMENT")
    void testCreateManagementCancellationRefund() {
        ReservationCancellationRequest request = ReservationCancellationRequest.builder()
                .reason("Building structural reconfiguration")
                .build();

        ReservationRefund product = refundFactory.createManagementCancellationRefund(
                reservation, payment, request, staffPrincipal, new BigDecimal("2250000"));

        assertNotNull(product);
        assertEquals(RefundStatus.PENDING_PAYMENT, product.getRefundStatus());
        assertEquals(UserRole.ADMIN.name(), product.getInitiatedByRole());
        assertEquals(201L, product.getInitiatedByUserId());
        assertEquals(new BigDecimal("2250000"), product.getOriginalFee());
        assertEquals(new BigDecimal("2250000"), product.getRefundAmount());
        assertEquals(BigDecimal.ZERO, product.getCompanyRetainedAmount(), "Management cancellation mandates 100% full refund with 0 retention");
        assertNotNull(product.getReviewedAt());
    }

    @Test
    @DisplayName("Factory Pattern: Creates Expired Reservation Refund product with APPROVED status and calculated retention")
    void testCreateExpiredReservationRefund() {
        ReservationCancellationRequest request = ReservationCancellationRequest.builder()
                .reason("48-hour expiration period passed")
                .build();

        BigDecimal deposit = new BigDecimal("2250000");
        BigDecimal retainedFee = new BigDecimal("50000"); // Standard cancellation fee retention

        ReservationRefund product = refundFactory.createExpiredReservationRefund(
                reservation, payment, request, staffPrincipal, deposit, retainedFee);

        assertNotNull(product);
        assertEquals(RefundStatus.APPROVED, product.getRefundStatus());
        assertEquals(new BigDecimal("2200000"), product.getRefundAmount()); // 2,250,000 - 50,000
        assertEquals(retainedFee, product.getCompanyRetainedAmount());
    }
}
