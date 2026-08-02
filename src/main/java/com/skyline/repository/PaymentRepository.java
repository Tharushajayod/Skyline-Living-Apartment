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

}