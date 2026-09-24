package com.skyline.repository;

import com.skyline.entity.PaymentPlan;
import com.skyline.enums.PaymentPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentPlanRepository
        extends JpaRepository<PaymentPlan, Long> {

    List<PaymentPlan> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<PaymentPlan> findByReservationIdOrderByCreatedAtDesc(Long reservationId);

    List<PaymentPlan> findByApartmentIdOrderByCreatedAtDesc(Long apartmentId);

    List<PaymentPlan> findByStatusOrderByCreatedAtDesc(
            PaymentPlanStatus status
    );

    Optional<PaymentPlan>
    findFirstByReservationIdAndStatusOrderByCreatedAtDesc(
            Long reservationId,
            PaymentPlanStatus status
    );

    boolean existsByReservationIdAndStatusIn(
            Long reservationId,
            List<PaymentPlanStatus> statuses
    );

    List<PaymentPlan> findByReservationIdInOrApartmentIdIn(
            java.util.Collection<Long> reservationIds,
            java.util.Collection<Long> apartmentIds
    );

    List<PaymentPlan> findByReservationIdIn(
            java.util.Collection<Long> reservationIds
    );
}