package com.skyline.factory.reservation;

import com.skyline.dto.reservation.ReservationCancellationRequest;
import com.skyline.entity.Payment;
import com.skyline.entity.Reservation;
import com.skyline.entity.ReservationRefund;
import com.skyline.security.UserPrincipal;

import java.math.BigDecimal;

/**
 * Factory Pattern: Abstract Factory Interface for Reservation Refund Entity Creation.
 * Encapsulates the instantiation of ReservationRefund products according to cancellation initiator
 * and domain business lifecycle rules.
 */
public interface ReservationRefundFactory {

    /**
     * Creates a customer-initiated cancellation refund product (PENDING_REVIEW, unfinalized retention).
     */
    ReservationRefund createCustomerCancellationRefund(
            Reservation reservation,
            Payment payment,
            ReservationCancellationRequest request,
            UserPrincipal principal,
            BigDecimal depositAmount
    );

    /**
     * Creates a management-initiated cancellation refund product (PENDING_PAYMENT, 100% full refund).
     */
    ReservationRefund createManagementCancellationRefund(
            Reservation reservation,
            Payment payment,
            ReservationCancellationRequest request,
            UserPrincipal principal,
            BigDecimal depositAmount
    );

    /**
     * Creates an expiration auto-settlement refund product (APPROVED, standard retention policy).
     */
    ReservationRefund createExpiredReservationRefund(
            Reservation reservation,
            Payment payment,
            ReservationCancellationRequest request,
            UserPrincipal principal,
            BigDecimal depositAmount,
            BigDecimal retainedFee
    );
}
