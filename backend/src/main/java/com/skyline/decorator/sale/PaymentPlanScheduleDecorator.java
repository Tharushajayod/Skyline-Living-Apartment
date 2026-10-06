package com.skyline.decorator.sale;

import com.skyline.dto.payment.PaymentPlanItemResponse;
import com.skyline.dto.payment.PaymentPlanResponse;
import com.skyline.dto.sale.SaleDetailsResponse;
import com.skyline.entity.Apartment;
import com.skyline.entity.PaymentPlan;
import com.skyline.entity.Reservation;
import com.skyline.entity.Sale;
import com.skyline.repository.PaymentPlanItemRepository;
import com.skyline.repository.PaymentPlanRepository;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Decorator Pattern: Concrete Decorator for Payment Plan Schedule.

 * Enriches the sale statement with the installment plan schedule, ordered
 * payment milestones, and installment settlement statuses.
 */
public class PaymentPlanScheduleDecorator extends SaleStatementDecorator {

    private final Sale sale;
    private final PaymentPlanRepository paymentPlanRepository;
    private final PaymentPlanItemRepository paymentPlanItemRepository;

    public PaymentPlanScheduleDecorator(SaleStatementComponent decoratedStatement,
                                        Sale sale,
                                        PaymentPlanRepository paymentPlanRepository,
                                        PaymentPlanItemRepository paymentPlanItemRepository) {
        super(decoratedStatement);
        this.sale = sale;
        this.paymentPlanRepository = paymentPlanRepository;
        this.paymentPlanItemRepository = paymentPlanItemRepository;
    }

    @Override
    public SaleDetailsResponse generateStatement() {
        // Decorator Pattern: Delegate to wrapped component first
        SaleDetailsResponse response = super.generateStatement();

        if (sale == null || paymentPlanRepository == null) {
            return response;
        }

        Apartment apartment = sale.getApartment();
        Reservation reservation = sale.getReservation();

        // Payment Plan Details (if applicable)
        PaymentPlan paymentPlan = null;
        if (reservation != null && reservation.getId() != null) {
            List<PaymentPlan> plans = paymentPlanRepository.findByReservationIdOrderByCreatedAtDesc(reservation.getId());
            if (!plans.isEmpty()) {
                paymentPlan = plans.get(0);
            }
        }
        if (paymentPlan == null && apartment != null && apartment.getId() != null) {
            List<PaymentPlan> aptPlans = paymentPlanRepository.findByApartmentIdOrderByCreatedAtDesc(apartment.getId());
            if (!aptPlans.isEmpty()) {
                paymentPlan = aptPlans.get(0);
            }
        }

        PaymentPlanResponse paymentPlanResponse = null;
        if (paymentPlan != null) {
            paymentPlanResponse = PaymentPlanResponse.fromEntity(paymentPlan);
            if (paymentPlanItemRepository != null) {
                List<PaymentPlanItemResponse> items = paymentPlanItemRepository
                        .findByPaymentPlanIdOrderBySequenceNoAsc(paymentPlan.getId())
                        .stream()
                        .map(PaymentPlanItemResponse::fromEntity)
                        .collect(Collectors.toList());
                paymentPlanResponse.setItems(items);
            }
        }

        // Decorator Pattern: Attach enhanced responsibility to response
        response.setPaymentPlan(paymentPlanResponse);

        return response;
    }
}
