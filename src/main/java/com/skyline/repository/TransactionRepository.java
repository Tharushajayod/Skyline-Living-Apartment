package com.skyline.repository;

import com.skyline.entity.Transaction;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByTransactionNumber(String transactionNumber);

    List<Transaction> findByPaymentPaymentId(Long paymentId);

    List<Transaction>findByPaymentCustomerUserEmailOrderByProcessedDateDesc(String email);

    boolean existsByPaymentPaymentIdAndTransactionStatus(
            Long paymentId,
            String transactionStatus
    );

    List<Transaction>findAllByOrderByProcessedDateDesc(Pageable pageable);
}

