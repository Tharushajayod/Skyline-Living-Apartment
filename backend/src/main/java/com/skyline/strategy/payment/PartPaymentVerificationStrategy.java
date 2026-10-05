package com.skyline.strategy.payment;

import com.skyline.entity.Payment;
import com.skyline.entity.PaymentPlan;
import com.skyline.entity.PaymentPlanItem;
import com.skyline.enums.PaymentPlanItemStatus;
import com.skyline.enums.PaymentPlanStatus;
import com.skyline.enums.PaymentType;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.PaymentPlanItemRepository;
import com.skyline.repository.PaymentPlanRepository;
import com.skyline.repository.PaymentRepository;
import com.skyline.repository.SaleRepository;
import com.skyline.security.UserPrincipal;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Strategy Pattern: Concrete Strategy for verifying ad-hoc part payments.
 * Reconciles the PaymentPlan schedule balance, updates PaymentPlanItem to PAID if linked,
 * and marks apartment as SOLD if the balance is fully settled.
 */
@Component
public class PartPaymentVerificationStrategy extends AbstractPaymentVerificationStrategy {

    private final PaymentPlanRepository paymentPlanRepository;
    private final PaymentPlanItemRepository paymentPlanItemRepository;

    public PartPaymentVerificationStrategy(
            ApartmentRepository apartmentRepository,
            PaymentRepository paymentRepository,
            SaleRepository saleRepository,
            PaymentPlanRepository paymentPlanRepository,
            PaymentPlanItemRepository paymentPlanItemRepository) {
        super(apartmentRepository, paymentRepository, saleRepository);
        this.paymentPlanRepository = paymentPlanRepository;
        this.paymentPlanItemRepository = paymentPlanItemRepository;
    }

    @Override
    public boolean supports(PaymentType paymentType) {
        return paymentType == PaymentType.PART_PAYMENT;
    }

    @Override
    public void executePostVerification(Payment payment, UserPrincipal principal, String verifierName) {
        // Reconcile Payment Plan balance
        if (payment.getPaymentPlan() != null) {
            PaymentPlan plan = payment.getPaymentPlan();
            BigDecimal currentPlanRemaining = plan.getRemainingAmount() != null
                    ? plan.getRemainingAmount()
                    : BigDecimal.ZERO;

            BigDecimal newPlanRemaining = currentPlanRemaining.subtract(payment.getAmount());
            if (newPlanRemaining.compareTo(BigDecimal.ZERO) < 0) {
                newPlanRemaining = BigDecimal.ZERO;
            }

            plan.setRemainingAmount(newPlanRemaining);
            if (newPlanRemaining.compareTo(BigDecimal.ZERO) == 0) {
                plan.setStatus(PaymentPlanStatus.COMPLETED);
            }
            paymentPlanRepository.save(plan);

            // Reconcile scheduled item if linked
            if (payment.getPaymentPlanItem() != null) {
                PaymentPlanItem item = payment.getPaymentPlanItem();
                item.setStatus(PaymentPlanItemStatus.PAID);
                paymentPlanItemRepository.save(item);
            }
        }

        // Check if all verified payments for the apartment have settled the total price
        checkAndMarkApartmentSold(payment, principal, verifierName);
    }
}
