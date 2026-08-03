package com.skyline.repository;

import com.skyline.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.math.BigDecimal;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByCustomerCustomerId(Long customerId);

    List<Payment> findByPaymentStatus(String paymentStatus);

    List<Payment> findByPaymentType(String paymentType);

    List<Payment> findByCustomerUserEmailOrderByCreatedAtDesc(String email);

    List<Payment> findByPaymentStatusOrderByCreatedAtDesc(String paymentStatus);

    List<Payment> findByPaymentStatusInOrderByCreatedAtDesc(List<String> paymentStatuses);

    long countByPaymentStatus(String paymentStatus);

    @Query(
        value = """
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE payment_status = 'PAID'
                """,
        nativeQuery = true
    )
    BigDecimal calculateTotalRevenue();

    @Query(
            value = """
                    SELECT COALESCE(SUM(amount), 0)
                    FROM payments
                    WHERE payment_status IN (
                        'PENDING',
                        'PARTIALLY_PAID'
                    )
                    """,
            nativeQuery = true
    )
    BigDecimal calculateTotalOutstandingAmount();

    @Query(value = """
        SELECT
        MONTH(payment_date),
        COALESCE(SUM(amount),0)
        FROM payments
        WHERE YEAR(payment_date)=:year
        AND payment_status='PAID'
        GROUP BY MONTH(payment_date)
        ORDER BY MONTH(payment_date)
        """, nativeQuery = true)

    List<Object[]> getMonthlyRevenue(Integer year);

    @Query(
        value = """
                SELECT
                    payment_method,
                    COUNT(*) AS payment_count,
                    COALESCE(SUM(amount), 0) AS total_amount
                FROM payments
                WHERE payment_status = 'PAID'
                GROUP BY payment_method
                ORDER BY total_amount DESC
                """,
        nativeQuery = true
    )
    List<Object[]> getRevenueByPaymentMethod();

}