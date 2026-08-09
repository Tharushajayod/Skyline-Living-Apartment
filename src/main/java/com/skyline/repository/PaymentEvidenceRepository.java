package com.skyline.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.skyline.entity.PaymentEvidence;

@Repository
public interface PaymentEvidenceRepository
        extends JpaRepository<PaymentEvidence, Long> {

    List<PaymentEvidence>
    findByPaymentPaymentIdOrderByUploadedAtDesc(
            Long paymentId
    );

    boolean existsByPaymentPaymentId(
            Long paymentId
    );

    Optional<PaymentEvidence>
    findByFileUrl(
            String fileUrl
    );

    boolean existsByFileUrl(
            String fileUrl
    );

    /*
     * Ownership check is executed directly by the database.
     *
     * PaymentEvidence
     *   -> Payment
     *   -> Customer
     *   -> User
     *   -> email
     */
    boolean existsByFileUrlAndPaymentCustomerUserEmail(
            String fileUrl,
            String email
    );
}