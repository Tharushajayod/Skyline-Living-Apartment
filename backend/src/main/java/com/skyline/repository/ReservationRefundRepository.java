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

    boolean existsByReservationId(Long reservationId);

    @Query("SELECT COALESCE(SUM(r.companyRetainedAmount), 0) FROM ReservationRefund r")
    BigDecimal sumTotalCompanyRetained();

    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM ReservationRefund r WHERE r.refundStatus = :status")
    BigDecimal sumTotalRefundByStatus(RefundStatus status);
}
