package com.skyline.service.impl;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
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

    private final PaymentRepository
            paymentRepository;

    private final PaymentEvidenceRepository
            evidenceRepository;

    private final UserRepository
            userRepository;

    private final FileStorageService
            fileStorageService;

    public PaymentEvidenceServiceImpl(

            PaymentRepository paymentRepository,

            PaymentEvidenceRepository evidenceRepository,

            UserRepository userRepository,

            FileStorageService fileStorageService
    ) {

        this.paymentRepository =
                paymentRepository;

        this.evidenceRepository =
                evidenceRepository;

        this.userRepository =
                userRepository;

        this.fileStorageService =
                fileStorageService;
    }

    /* =====================================================
       UPLOAD PAYMENT EVIDENCE

       Only the customer who owns the payment can upload
       evidence to that payment.
    ====================================================== */

    @Override
    @Transactional
    public PaymentEvidenceResponse uploadEvidence(

            Long paymentId,

            MultipartFile file,

            String userEmail
    ) {

        Payment payment =
                getPayment(paymentId);

        User currentUser =
                getUser(userEmail);

        /*
         * Controller already requires CUSTOMER,
         * but ownership must also be checked here.
         */
        if (!isPaymentOwner(
                payment,
                currentUser
        )) {

            throw new AccessDeniedException(
                    "You are not allowed to upload evidence for this payment"
            );
        }

        validateFile(file);

        String storedFile =
                fileStorageService
                        .storeFile(
                                file,
                                "payment-evidence"
                        );

        PaymentEvidence evidence =
                new PaymentEvidence();

        evidence.setPayment(
                payment
        );

        evidence.setUploadedBy(
                currentUser
        );

        evidence.setFileName(
                file.getOriginalFilename() != null
                        ? file.getOriginalFilename()
                        : storedFile
        );

        evidence.setMimeType(
                file.getContentType() != null
                        ? file.getContentType()
                        : "application/octet-stream"
        );

        evidence.setFileUrl(
                "/api/files/payment-evidence/"
                        + storedFile
        );

        PaymentEvidence savedEvidence =
                evidenceRepository
                        .save(
                                evidence
                        );

        return map(
                savedEvidence
        );
    }

    /* =====================================================
       VIEW PAYMENT EVIDENCE

       ADMIN / FINANCE:
           Can view evidence for all payments.

       CUSTOMER:
           Can view evidence only for own payment.
    ====================================================== */

    @Override
    @Transactional(readOnly = true)
    public List<PaymentEvidenceResponse>
    getPaymentEvidence(

            Long paymentId,

            String userEmail
    ) {

        Payment payment =
                getPayment(paymentId);

        User currentUser =
                getUser(userEmail);

        boolean staffAccess =
                hasAnyRole(
                        currentUser,
                        "ADMIN",
                        "FINANCE_OFFICER"
                );

        boolean ownerAccess =
                isPaymentOwner(
                        payment,
                        currentUser
                );

        if (!staffAccess
                && !ownerAccess) {

            throw new AccessDeniedException(
                    "You are not allowed to view evidence for this payment"
            );
        }

        return evidenceRepository
                .findByPaymentPaymentIdOrderByUploadedAtDesc(
                        paymentId
                )
                .stream()
                .map(this::map)
                .toList();
    }

    /* =====================================================
       DELETE PAYMENT EVIDENCE

       ADMIN:
           Can delete evidence.

       CUSTOMER:
           Can delete evidence only when the payment belongs
           to that customer.

       FINANCE:
           Not allowed by controller.
    ====================================================== */

    @Override
    @Transactional
    public void deleteEvidence(

            Long evidenceId,

            String userEmail
    ) {

        PaymentEvidence evidence =
                evidenceRepository
                        .findById(
                                evidenceId
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Evidence not found"
                                )
                        );

        User currentUser =
                getUser(userEmail);

        Payment payment =
                evidence.getPayment();

        boolean isAdmin =
                hasAnyRole(
                        currentUser,
                        "ADMIN"
                );

        boolean isOwner =
                isPaymentOwner(
                        payment,
                        currentUser
                );

        if (!isAdmin
                && !isOwner) {

            throw new AccessDeniedException(
                    "You are not allowed to delete this payment evidence"
            );
        }

        /*
         * Delete stored file first.
         */
        if (evidence.getFileUrl() != null
                && !evidence
                        .getFileUrl()
                        .isBlank()) {

            String fileName =
                    evidence.getFileUrl()
                            .substring(
                                    evidence
                                            .getFileUrl()
                                            .lastIndexOf("/")
                                            + 1
                            );

            fileStorageService
                    .deleteFile(
                            "payment-evidence",
                            fileName
                    );
        }

        evidenceRepository
                .delete(
                        evidence
                );
    }

    /* =====================================================
       PAYMENT LOOKUP
    ====================================================== */

    private Payment getPayment(
            Long paymentId
    ) {

        return paymentRepository
                .findById(
                        paymentId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Payment not found"
                        )
                );
    }

    /* =====================================================
       CURRENT USER LOOKUP
    ====================================================== */

    private User getUser(
            String userEmail
    ) {

        if (userEmail == null
                || userEmail.isBlank()) {

            throw new AccessDeniedException(
                    "Authenticated user is required"
            );
        }

        String normalizedEmail =
                userEmail
                        .trim()
                        .toLowerCase();

        return userRepository
                .findByEmail(
                        normalizedEmail
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"
                        )
                );
    }

    /* =====================================================
       PAYMENT OWNERSHIP CHECK
    ====================================================== */

    private boolean isPaymentOwner(

            Payment payment,

            User user
    ) {

        if (payment == null
                || payment.getCustomer() == null
                || payment.getCustomer()
                        .getUser() == null
                || payment.getCustomer()
                        .getUser()
                        .getEmail() == null
                || user == null
                || user.getEmail() == null) {

            return false;
        }

        return payment
                .getCustomer()
                .getUser()
                .getEmail()
                .equalsIgnoreCase(
                        user.getEmail()
                );
    }

    /* =====================================================
       ROLE CHECK
    ====================================================== */

    private boolean hasAnyRole(

            User user,

            String... roles
    ) {

        if (user == null
                || user.getRoles() == null) {

            return false;
        }

        for (var userRole :
                user.getRoles()) {

            String currentRole =
                    userRole.getRoleName();

            if (currentRole == null) {
                continue;
            }

            for (String allowedRole :
                    roles) {

                if (allowedRole
                        .equalsIgnoreCase(
                                currentRole
                        )) {

                    return true;
                }
            }
        }

        return false;
    }

    /* =====================================================
       FILE VALIDATION
    ====================================================== */

    private void validateFile(
            MultipartFile file
    ) {

        if (file == null
                || file.isEmpty()) {

            throw new IllegalArgumentException(
                    "Payment evidence file is required"
            );
        }

        String contentType =
                file.getContentType();

        /*
         * Payment evidence should normally be
         * an image or PDF.
         */
        boolean validType =
                contentType != null
                        && (
                        contentType.startsWith(
                                "image/"
                        )
                                || "application/pdf"
                                .equalsIgnoreCase(
                                        contentType
                                )
                );

        if (!validType) {

            throw new IllegalArgumentException(
                    "Only image or PDF files are allowed"
            );
        }
    }

    /* =====================================================
       DTO MAPPING
    ====================================================== */

    private PaymentEvidenceResponse map(
            PaymentEvidence evidence
    ) {

        return new PaymentEvidenceResponse(

                evidence
                        .getPaymentEvidenceId(),

                evidence
                        .getPayment()
                        .getPaymentId(),

                evidence
                        .getFileName(),

                evidence
                        .getFileUrl(),

                evidence
                        .getMimeType(),

                evidence
                        .getUploadedBy()
                        .getUserId(),

                evidence
                        .getUploadedBy()
                        .getFullName(),

                evidence
                        .getUploadedAt()
        );
    }
}