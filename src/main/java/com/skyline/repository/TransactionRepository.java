package com.skyline.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.skyline.entity.Transaction;

@Repository
public interface TransactionRepository
        extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByTransactionNumber(
            String transactionNumber
    );

    List<Transaction> findByPaymentPaymentId(
            Long paymentId
    );

    List<Transaction>
    findByPaymentCustomerUserEmailOrderByProcessedDateDesc(
            String email
    );

    Optional<Transaction>
    findByTransactionIdAndPaymentCustomerUserEmail(
            Long transactionId,
            String email
    );

    List<Transaction> findAllByOrderByProcessedDateDesc();

    List<Transaction>
    findByTransactionStatusOrderByProcessedDateDesc(
            String transactionStatus
    );

    boolean existsByPaymentPaymentIdAndTransactionStatus(
            Long paymentId,
            String transactionStatus
    );

    List<Transaction> findAllByOrderByProcessedDateDesc(
            Pageable pageable
    );

    long countByTransactionStatus(
            String transactionStatus
    );
}
