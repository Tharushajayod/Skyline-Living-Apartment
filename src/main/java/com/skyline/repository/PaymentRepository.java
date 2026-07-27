package com.skyline.repository;

import com.skyline.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByCustomerCustomerId(Long customerId);

    List<Payment> findByPaymentStatus(String paymentStatus);

    List<Payment> findByPaymentType(String paymentType);

}