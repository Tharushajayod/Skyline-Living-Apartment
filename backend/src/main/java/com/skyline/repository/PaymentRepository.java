package com.skyline.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.skyline.entity.Payment;
import com.skyline.enums.PaymentStatus;
import com.skyline.enums.PaymentType;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByCustomerIdOrderByUploadedAtDesc(Long customerId);

    List<Payment> findByCustomer_EmailOrderByUploadedAtDesc(String email);

    List<Payment> findByReservationId(Long reservationId);

    List<Payment> findByApartmentId(Long apartmentId);

    List<Payment> findByStatus(PaymentStatus status);

    long countByStatus(PaymentStatus status);

    @Query("""
        SELECT COALESCE(SUM(p.amount), 0)
        FROM Payment p
        WHERE p.status = :status
    """)
    BigDecimal sumAmountByStatus(
            @Param("status") PaymentStatus status
    );

    boolean existsByReservationIdAndTypeAndStatus(
            Long reservationId,
            PaymentType type,
            PaymentStatus status
    );

    @Query("""
        SELECT COALESCE(SUM(p.amount), 0)
        FROM Payment p
        WHERE p.reservation.id = :reservationId
          AND p.status = :status
    """)
    BigDecimal sumAmountByReservationAndStatus(
            @Param("reservationId") Long reservationId,
            @Param("status") PaymentStatus status
    );

    @Query("""
        SELECT COALESCE(SUM(p.amount), 0)
        FROM Payment p
        WHERE p.apartment.id = :apartmentId
          AND p.status = :status
    """)
    BigDecimal sumAmountByApartmentAndStatus(
            @Param("apartmentId") Long apartmentId,
            @Param("status") PaymentStatus status
    );
}