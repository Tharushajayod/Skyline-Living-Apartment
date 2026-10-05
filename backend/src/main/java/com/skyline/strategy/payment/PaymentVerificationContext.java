package com.skyline.strategy.payment;

import com.skyline.entity.Payment;
import com.skyline.enums.PaymentType;
import com.skyline.security.UserPrincipal;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Strategy Pattern: Strategy Context managing runtime payment verification strategies.
 *
 * It dynamically selects the appropriate concrete strategy at runtime
 * matching the payment's PaymentType.
 */
@Component
public class PaymentVerificationContext {

    // Strategy Pattern: List of concrete strategies injected at runtime
    private final List<PaymentVerificationStrategy> strategies;

    public PaymentVerificationContext(List<PaymentVerificationStrategy> strategies) {
        this.strategies = strategies;
    }

    /**
     * Runtime Strategy Selection: Selects and executes the concrete strategy
     * corresponding to the Payment's PaymentType.
     */
    public void executePostVerification(Payment payment, UserPrincipal principal, String verifierName) {
        if (payment == null || payment.getType() == null) {
            return;
        }

        PaymentType type = payment.getType();

        // Strategy Pattern: Runtime strategy selection
        PaymentVerificationStrategy strategy = strategies.stream()
                .filter(s -> s.supports(type))
                .findFirst()
                .orElse(null);

        if (strategy != null) {
            strategy.executePostVerification(payment, principal, verifierName);
        }
    }

    public List<PaymentVerificationStrategy> getStrategies() {
        return strategies;
    }
}
