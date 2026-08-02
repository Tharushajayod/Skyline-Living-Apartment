package com.skyline.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.skyline.dto.ApiResponse;
import com.skyline.dto.payment.PaymentEvidenceResponse;
import com.skyline.service.PaymentEvidenceService;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/payments")
public class PaymentEvidenceController {

    private final PaymentEvidenceService paymentEvidenceService;

    public PaymentEvidenceController(
            PaymentEvidenceService paymentEvidenceService) {

        this.paymentEvidenceService = paymentEvidenceService;
    }

    @PostMapping("/{paymentId}/evidence")
    public PaymentEvidenceResponse uploadEvidence(

            @PathVariable Long paymentId,

            @RequestParam("file") MultipartFile file,

            Authentication authentication) {

        return paymentEvidenceService.uploadEvidence(
                paymentId,
                file,
                authentication.getName());
    }

    @GetMapping("/{paymentId}/evidence")
    public List<PaymentEvidenceResponse> getEvidence(

            @PathVariable Long paymentId) {

        return paymentEvidenceService.getPaymentEvidence(paymentId);
    }

    @DeleteMapping("/evidence/{evidenceId}")
    public ApiResponse deleteEvidence(

            @PathVariable Long evidenceId,

            Authentication authentication) {

        paymentEvidenceService.deleteEvidence(
                evidenceId,
                authentication.getName());

        return new ApiResponse(
                true,
                "Payment evidence deleted successfully",
                LocalDateTime.now());
    }

}