package com.skyline.controller;

import com.skyline.dto.payment.PaymentRequest;
import com.skyline.dto.payment.PaymentResponse;
import com.skyline.dto.payment.PaymentVerificationRequest;
import com.skyline.security.UserPrincipal;
import com.skyline.service.PaymentService;
import com.skyline.util.IdParser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getPayments(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false, name = "customer") String customerParam) {
        List<PaymentResponse> payments = paymentService.getPayments(userPrincipal, customerParam);
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable String id) {
        Long numericId = IdParser.parseId(id);
        return ResponseEntity.ok(paymentService.getPaymentById(numericId));
    }

    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody PaymentRequest request) {
        PaymentResponse created = paymentService.createPayment(userPrincipal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping(value = "/{id}/proof", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PaymentResponse> uploadProof(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long numericId = IdParser.parseId(id);
        PaymentResponse updated = paymentService.uploadProof(numericId, file, userPrincipal);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<PaymentResponse> verifyPayment(
            @PathVariable String id,
            @RequestBody(required = false) PaymentVerificationRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long numericId = IdParser.parseId(id);
        PaymentResponse verified = paymentService.verifyPayment(numericId, request, userPrincipal);
        return ResponseEntity.ok(verified);
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<PaymentResponse> rejectPayment(
            @PathVariable String id,
            @RequestBody(required = false) PaymentVerificationRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long numericId = IdParser.parseId(id);
        PaymentResponse rejected = paymentService.rejectPayment(numericId, request, userPrincipal);
        return ResponseEntity.ok(rejected);
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<Map<String, Object>> getReceipt(@PathVariable String id) {
        Long numericId = IdParser.parseId(id);
        PaymentResponse payment = paymentService.getPaymentById(numericId);
        return ResponseEntity.ok(Map.of(
                "receiptNumber", "REC-" + payment.getId(),
                "paymentId", payment.getId(),
                "apartmentTitle", payment.getApartmentTitle(),
                "customerName", payment.getCustomerName(),
                "amount", payment.getAmount(),
                "type", payment.getType(),
                "status", payment.getStatus(),
                "verifiedAt", payment.getVerifiedAt() != null ? payment.getVerifiedAt() : "",
                "verifiedBy", payment.getVerifiedBy() != null ? payment.getVerifiedBy() : ""
        ));
    }
}
