package com.skyline.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skyline.entity.PaymentEvidence;

public interface PaymentEvidenceRepository
        extends JpaRepository<PaymentEvidence, Long> {

    List<PaymentEvidence>
    findByPaymentPaymentIdOrderByUploadedAtDesc(
            Long paymentId
    );

    boolean existsByPaymentPaymentId(Long paymentId);
}