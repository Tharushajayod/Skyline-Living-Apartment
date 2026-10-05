package com.skyline.repository;

import com.skyline.entity.ReservationRefund;
import com.skyline.enums.RefundStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRefundRepository extends JpaRepository<ReservationRefund, Long> {

    List<ReservationRefund> findAllByOrderByCreatedAtDesc();

    List<ReservationRefund> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<ReservationRefund> findByApartmentIdOrderByCreatedAtDesc(Long apartmentId);

    Optional<ReservationRefund> findByReservationId(Long reservationId);

    List<ReservationRefund> findByReservationIdIn(java.util.Collection<Long> reservationIds);

    boolean existsByReservationId(Long reservationId);

    @Query("SELECT COALESCE(SUM(r.companyRetainedAmount), 0) FROM ReservationRefund r WHERE r.refundStatus IN (com.skyline.enums.RefundStatus.PENDING_PAYMENT, com.skyline.enums.RefundStatus.APPROVED, com.skyline.enums.RefundStatus.PROCESSED, com.skyline.enums.RefundStatus.COMPLETED)")
    BigDecimal sumTotalCompanyRetained();

    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM ReservationRefund r WHERE r.refundStatus = :status")
    BigDecimal sumTotalRefundByStatus(@org.springframework.data.repository.query.Param("status") RefundStatus status);

    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM ReservationRefund r WHERE r.refundStatus = :status AND r.processedAt >= :start AND r.processedAt <= :end")
    BigDecimal sumRefundAmountByStatusAndProcessedAtBetween(
            @org.springframework.data.repository.query.Param("status") RefundStatus status,
            @org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start,
            @org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end
    );

    @Query("SELECT r FROM ReservationRefund r WHERE r.refundStatus = :status AND r.processedAt >= :start AND r.processedAt <= :end ORDER BY r.processedAt ASC")
    List<ReservationRefund> findByRefundStatusAndProcessedAtBetween(
            @org.springframework.data.repository.query.Param("status") RefundStatus status,
            @org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start,
            @org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end
    );

    List<ReservationRefund> findByRefundStatus(RefundStatus status);

    long countByRefundStatus(RefundStatus status);

    long countByRefundStatusIn(java.util.Collection<RefundStatus> statuses);
}
