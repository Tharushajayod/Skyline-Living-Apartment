package com.skyline.repository;

import com.skyline.entity.PaymentPlanItem;
import com.skyline.enums.PaymentPlanItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentPlanItemRepository
        extends JpaRepository<PaymentPlanItem, Long> {

    List<PaymentPlanItem>
    findByPaymentPlanIdOrderBySequenceNoAsc(
            Long paymentPlanId
    );

    long countByPaymentPlanIdAndStatus(
            Long paymentPlanId,
            PaymentPlanItemStatus status
    );

    boolean existsByPaymentPlanId(
            Long paymentPlanId
    );

    void deleteByPaymentPlanId(
            Long paymentPlanId
    );
}