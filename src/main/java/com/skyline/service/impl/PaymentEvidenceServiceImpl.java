package com.skyline.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.skyline.dto.payment.PaymentEvidenceResponse;
import com.skyline.entity.Payment;
import com.skyline.entity.PaymentEvidence;
import com.skyline.entity.User;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.PaymentEvidenceRepository;
import com.skyline.repository.PaymentRepository;
import com.skyline.repository.UserRepository;
import com.skyline.service.FileStorageService;
import com.skyline.service.PaymentEvidenceService;

@Service
public class PaymentEvidenceServiceImpl
        implements PaymentEvidenceService {

    private final PaymentRepository paymentRepository;
    private final PaymentEvidenceRepository evidenceRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public PaymentEvidenceServiceImpl(
            PaymentRepository paymentRepository,
            PaymentEvidenceRepository evidenceRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService
    ) {

        this.paymentRepository = paymentRepository;
        this.evidenceRepository = evidenceRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    @Override
    @Transactional
    public PaymentEvidenceResponse uploadEvidence(
            Long paymentId,
            MultipartFile file,
            String userEmail
    ) {

        Payment payment =
                paymentRepository.findById(paymentId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Payment not found"
                                ));

        User user =
                userRepository.findByEmail(userEmail)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "User not found"
                                ));

        String storedFile =
                fileStorageService.storeFile(
                        file,
                        "payment-evidence"
                );

        PaymentEvidence evidence =
                new PaymentEvidence();

        evidence.setPayment(payment);
        evidence.setUploadedBy(user);
        evidence.setFileName(file.getOriginalFilename());
        evidence.setMimeType(file.getContentType());
        evidence.setFileUrl(
                "/api/files/payment-evidence/" + storedFile
        );

        evidenceRepository.save(evidence);

        return map(evidence);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentEvidenceResponse> getPaymentEvidence(
            Long paymentId
    ) {

        return evidenceRepository
                .findByPaymentPaymentIdOrderByUploadedAtDesc(
                        paymentId
                )
                .stream()
                .map(this::map)
                .toList();
    }

    @Override
    @Transactional
    public void deleteEvidence(
            Long evidenceId,
            String userEmail
    ) {

        PaymentEvidence evidence =
                evidenceRepository.findById(evidenceId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Evidence not found"
                                ));

        String fileName =
                evidence.getFileUrl().substring(
                        evidence.getFileUrl()
                                .lastIndexOf("/") + 1
                );

        fileStorageService.deleteFile(
                "payment-evidence",
                fileName
        );

        evidenceRepository.delete(evidence);
    }

    private PaymentEvidenceResponse map(
            PaymentEvidence evidence
    ) {

        return new PaymentEvidenceResponse(

                evidence.getPaymentEvidenceId(),

                evidence.getPayment().getPaymentId(),

                evidence.getFileName(),

                evidence.getFileUrl(),

                evidence.getMimeType(),

                evidence.getUploadedBy().getUserId(),

                evidence.getUploadedBy().getFullName(),

                evidence.getUploadedAt()

        );
    }
}