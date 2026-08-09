package com.skyline.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.skyline.dto.ApiResponse;
import com.skyline.dto.payment.PaymentEvidenceResponse;
import com.skyline.service.PaymentEvidenceService;

@RestController
@RequestMapping("/api/payments")
public class PaymentEvidenceController {

    private final PaymentEvidenceService
            paymentEvidenceService;

    public PaymentEvidenceController(
            PaymentEvidenceService paymentEvidenceService
    ) {
        this.paymentEvidenceService =
                paymentEvidenceService;
    }

    /*
     * Customers can upload evidence only for
     * their own payment records.
     *
     * Ownership is verified again inside
     * PaymentEvidenceServiceImpl.
     */
    @PostMapping("/{paymentId}/evidence")
    @PreAuthorize("hasRole('CUSTOMER')")
    public PaymentEvidenceResponse uploadEvidence(

            @PathVariable
            Long paymentId,

            @RequestParam("file")
            MultipartFile file,

            Authentication authentication
    ) {

        return paymentEvidenceService
                .uploadEvidence(
                        paymentId,
                        file,
                        authentication.getName()
                );
    }

    /*
     * Customer:
     *   Can view evidence only for own payment.
     *
     * Finance/Admin:
     *   Can view evidence for management purposes.
     */
    @GetMapping("/{paymentId}/evidence")
    @PreAuthorize(
            "hasAnyRole('CUSTOMER', 'FINANCE_OFFICER', 'ADMIN')"
    )
    public List<PaymentEvidenceResponse>
    getEvidence(

            @PathVariable
            Long paymentId,

            Authentication authentication
    ) {

        return paymentEvidenceService
                .getPaymentEvidence(
                        paymentId,
                        authentication.getName()
                );
    }

    /*
     * Customer:
     *   Can delete evidence from own payment.
     *
     * Admin:
     *   Can delete evidence when necessary.
     *
     * Finance Officer is intentionally not
     * allowed to delete proof submitted by
     * customers.
     */
    @DeleteMapping("/evidence/{evidenceId}")
    @PreAuthorize(
            "hasAnyRole('CUSTOMER', 'ADMIN')"
    )
    public ApiResponse deleteEvidence(

            @PathVariable
            Long evidenceId,

            Authentication authentication
    ) {

        paymentEvidenceService
                .deleteEvidence(
                        evidenceId,
                        authentication.getName()
                );

        return new ApiResponse(
                true,
                "Payment evidence deleted successfully",
                LocalDateTime.now()
        );
    }
}