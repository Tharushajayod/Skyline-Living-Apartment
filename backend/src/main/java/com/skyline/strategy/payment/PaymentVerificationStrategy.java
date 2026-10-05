package com.skyline.strategy.payment;

import com.skyline.entity.Payment;
import com.skyline.enums.PaymentType;
import com.skyline.security.UserPrincipal;

/**
 * Strategy Pattern: Common Strategy Interface for post-verification processing.
 *
 * Each concrete strategy encapsulates the domain logic triggered when a specific
 * category of payment is verified by administrative staff.
 */
public interface PaymentVerificationStrategy {

    /**
     * Determines whether this strategy handles the given payment type.
     */
    boolean supports(PaymentType paymentType);

    /**
     * Executes the verification workflow specific to this payment category.
     */
    void executePostVerification(Payment payment, UserPrincipal principal, String verifierName);
}
