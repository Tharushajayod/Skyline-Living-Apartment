package com.skyline.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.skyline.dto.payment.PaymentEvidenceResponse;

public interface PaymentEvidenceService {

    PaymentEvidenceResponse uploadEvidence(
            Long paymentId,
            MultipartFile file,
            String userEmail
    );

    List<PaymentEvidenceResponse> getPaymentEvidence(
            Long paymentId
    );

    void deleteEvidence(
            Long evidenceId,
            String userEmail
    );
}