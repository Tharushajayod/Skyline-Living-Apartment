package com.skyline.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import com.skyline.dto.payment.CreatePaymentRequest;
import com.skyline.dto.payment.PaymentDetailsResponse;
import com.skyline.dto.payment.PaymentResponse;
import com.skyline.dto.payment.UpdatePaymentStatusRequest;
import com.skyline.service.PaymentService;
import com.skyline.dto.payment.PaymentDashboardSummaryResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(
            @Valid @RequestBody CreatePaymentRequest request) {

        PaymentResponse response = paymentService.createPayment(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPaymentById(
            @PathVariable Long paymentId) {

        return ResponseEntity.ok(
                paymentService.getPaymentById(paymentId));
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getAllPayments() {

        return ResponseEntity.ok(
                paymentService.getAllPayments());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByCustomer(
            @PathVariable Long customerId) {

        return ResponseEntity.ok(
                paymentService.getPaymentsByCustomer(customerId));
    }

    @PutMapping("/{paymentId}/status")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<PaymentResponse> updatePaymentStatus(
            @PathVariable Long paymentId,
            @Valid @RequestBody UpdatePaymentStatusRequest request,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                paymentService.updatePaymentStatus(
                        paymentId,
                        request,
                        authentication.getName()
                )
        );
    }

    @DeleteMapping("/{paymentId}")
    public ResponseEntity<Void> deletePayment(
            @PathVariable Long paymentId) {

        paymentService.deletePayment(paymentId);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-payments")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<PaymentResponse>>
    getMyPayments(

            Authentication authentication
    ) {

        return ResponseEntity.ok(

                paymentService.getMyPayments(

                        authentication.getName()

                )

        );
    }

    @GetMapping("/{paymentId}/details")
    public ResponseEntity<PaymentDetailsResponse> getPaymentDetails(
            @PathVariable Long paymentId,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                paymentService.getPaymentDetails(
                        paymentId,
                        authentication.getName()
                )
        );
    }

    @GetMapping("/pending")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<List<PaymentResponse>>
    getPendingPayments() {

        return ResponseEntity.ok(
                paymentService.getPaymentsByStatus(
                        "PENDING"
                )
        );
    }

    @GetMapping("/status/{status}")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<List<PaymentResponse>>
    getPaymentsByStatus(
            @PathVariable String status
    ) {

        return ResponseEntity.ok(
                paymentService.getPaymentsByStatus(status)
        );
    }

    @GetMapping("/dashboard-summary")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<PaymentDashboardSummaryResponse>
    getDashboardSummary() {

        return ResponseEntity.ok(
                paymentService.getDashboardSummary()
        );
    }
}