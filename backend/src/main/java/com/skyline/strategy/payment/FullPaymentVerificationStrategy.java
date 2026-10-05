package com.skyline.strategy.payment;

import com.skyline.entity.Apartment;
import com.skyline.entity.Payment;
import com.skyline.entity.PaymentPlan;
import com.skyline.enums.PaymentPlanStatus;
import com.skyline.enums.PaymentType;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.PaymentPlanRepository;
import com.skyline.repository.PaymentRepository;
import com.skyline.repository.SaleRepository;
import com.skyline.security.UserPrincipal;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Strategy Pattern: Concrete Strategy for verifying lump-sum full payments.
 * Directly marks apartment as SOLD, completes any associated plan, and creates the Sale deed record.
 */
@Component
public class FullPaymentVerificationStrategy extends AbstractPaymentVerificationStrategy {

    private final PaymentPlanRepository paymentPlanRepository;

    public FullPaymentVerificationStrategy(
            ApartmentRepository apartmentRepository,
            PaymentRepository paymentRepository,
            SaleRepository saleRepository,
            PaymentPlanRepository paymentPlanRepository) {
        super(apartmentRepository, paymentRepository, saleRepository);
        this.paymentPlanRepository = paymentPlanRepository;
    }

    @Override
    public boolean supports(PaymentType paymentType) {
        return paymentType == PaymentType.FULL_PAYMENT;
    }

    @Override
    public void executePostVerification(Payment payment, UserPrincipal principal, String verifierName) {
        // Mark associated payment plan as completed if linked
        if (payment.getPaymentPlan() != null) {
            PaymentPlan plan = payment.getPaymentPlan();
            plan.setRemainingAmount(BigDecimal.ZERO);
            plan.setStatus(PaymentPlanStatus.COMPLETED);
            paymentPlanRepository.save(plan);
        }

        // Full payment immediately marks apartment as SOLD and records Sale
        Apartment apartment = payment.getApartment();
        if (apartment != null) {
            markApartmentSold(apartment, payment, principal, verifierName);
        }
    }
}
