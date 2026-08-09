package com.skyline.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.skyline.dto.payment.CreatePaymentRequest;
import com.skyline.dto.payment.MonthlyRevenueResponse;
import com.skyline.dto.payment.PaymentDashboardSummaryResponse;
import com.skyline.dto.payment.PaymentDetailsResponse;
import com.skyline.dto.payment.PaymentMethodRevenueResponse;
import com.skyline.dto.payment.PaymentResponse;
import com.skyline.dto.payment.PaymentStatusReportResponse;
import com.skyline.dto.payment.RecentTransactionResponse;
import com.skyline.dto.payment.UpdatePaymentStatusRequest;
import com.skyline.service.PaymentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(
            PaymentService paymentService
    ) {
        this.paymentService =
                paymentService;
    }

    /* =====================================================
       CREATE PAYMENT
       Customer normally submits a payment.
       Admin / Finance can also create records when required.
    ====================================================== */

    @PostMapping
    @PreAuthorize(
            "hasAnyRole('CUSTOMER', 'FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<PaymentResponse>
    createPayment(
            @Valid
            @RequestBody
            CreatePaymentRequest request
    ) {

        PaymentResponse response =
                paymentService.createPayment(
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /* =====================================================
       GET ONE PAYMENT
       Finance and Admin only.
    ====================================================== */

    @GetMapping("/{paymentId}")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<PaymentResponse>
    getPaymentById(
            @PathVariable
            Long paymentId
    ) {

        return ResponseEntity.ok(
                paymentService.getPaymentById(
                        paymentId
                )
        );
    }

    /* =====================================================
       GET ALL PAYMENTS
       Finance and Admin only.
    ====================================================== */

    @GetMapping
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<List<PaymentResponse>>
    getAllPayments() {

        return ResponseEntity.ok(
                paymentService.getAllPayments()
        );
    }

    /* =====================================================
       GET PAYMENTS BY CUSTOMER ID
       Do not allow normal customers to query arbitrary IDs.
    ====================================================== */

    @GetMapping("/customer/{customerId}")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<List<PaymentResponse>>
    getPaymentsByCustomer(
            @PathVariable
            Long customerId
    ) {

        return ResponseEntity.ok(
                paymentService
                        .getPaymentsByCustomer(
                                customerId
                        )
        );
    }

    /* =====================================================
       CURRENT CUSTOMER PAYMENTS
       Uses authenticated email instead of a supplied ID.
    ====================================================== */

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

    /* =====================================================
       PAYMENT DETAILS
       Customer / Finance / Admin.

       The PaymentService.getPaymentDetails(...) method
       should continue checking ownership when the logged-in
       user is a CUSTOMER.
    ====================================================== */

    @GetMapping("/{paymentId}/details")
    @PreAuthorize(
            "hasAnyRole('CUSTOMER', 'FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<PaymentDetailsResponse>
    getPaymentDetails(
            @PathVariable
            Long paymentId,

            Authentication authentication
    ) {

        return ResponseEntity.ok(
                paymentService.getPaymentDetails(
                        paymentId,
                        authentication.getName()
                )
        );
    }

    /* =====================================================
       UPDATE PAYMENT STATUS
       Finance / Admin
    ====================================================== */

    @PutMapping("/{paymentId}/status")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<PaymentResponse>
    updatePaymentStatus(
            @PathVariable
            Long paymentId,

            @Valid
            @RequestBody
            UpdatePaymentStatusRequest request,

            Authentication authentication
    ) {

        return ResponseEntity.ok(
                paymentService
                        .updatePaymentStatus(
                                paymentId,
                                request,
                                authentication.getName()
                        )
        );
    }

    /* =====================================================
       DELETE PAYMENT
       Admin only
    ====================================================== */

    @DeleteMapping("/{paymentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void>
    deletePayment(
            @PathVariable
            Long paymentId
    ) {

        paymentService.deletePayment(
                paymentId
        );

        return ResponseEntity
                .noContent()
                .build();
    }

    /* =====================================================
       PENDING PAYMENTS
    ====================================================== */

    @GetMapping("/pending")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<List<PaymentResponse>>
    getPendingPayments() {

        return ResponseEntity.ok(
                paymentService
                        .getPaymentsByStatus(
                                "PENDING"
                        )
        );
    }

    /* =====================================================
       PAYMENTS BY STATUS
    ====================================================== */

    @GetMapping("/status/{status}")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<List<PaymentResponse>>
    getPaymentsByStatus(
            @PathVariable
            String status
    ) {

        return ResponseEntity.ok(
                paymentService
                        .getPaymentsByStatus(
                                status
                        )
        );
    }

    /* =====================================================
       DASHBOARD SUMMARY
    ====================================================== */

    @GetMapping("/dashboard-summary")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<PaymentDashboardSummaryResponse>
    getDashboardSummary() {

        return ResponseEntity.ok(
                paymentService
                        .getDashboardSummary()
        );
    }

    /* =====================================================
       MONTHLY REVENUE REPORT
    ====================================================== */

    @GetMapping("/reports/monthly-revenue")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<List<MonthlyRevenueResponse>>
    getMonthlyRevenue(
            @RequestParam
            Integer year
    ) {

        return ResponseEntity.ok(
                paymentService
                        .getMonthlyRevenue(
                                year
                        )
        );
    }

    /* =====================================================
       PAYMENT STATUS REPORT
    ====================================================== */

    @GetMapping("/reports/status")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<PaymentStatusReportResponse>
    getPaymentStatusReport() {

        return ResponseEntity.ok(
                paymentService
                        .getPaymentStatusReport()
        );
    }

    /* =====================================================
       OUTSTANDING PAYMENTS
    ====================================================== */

    @GetMapping("/reports/outstanding")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<List<PaymentResponse>>
    getOutstandingPayments() {

        return ResponseEntity.ok(
                paymentService
                        .getOutstandingPayments()
        );
    }

    /* =====================================================
       REVENUE BY PAYMENT METHOD
    ====================================================== */

    @GetMapping("/reports/payment-methods")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<List<PaymentMethodRevenueResponse>>
    getRevenueByPaymentMethod() {

        return ResponseEntity.ok(
                paymentService
                        .getRevenueByPaymentMethod()
        );
    }

    /* =====================================================
       RECENT TRANSACTIONS REPORT
    ====================================================== */

    @GetMapping("/reports/recent-transactions")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<List<RecentTransactionResponse>>
    getRecentTransactions(
            @RequestParam(
                    defaultValue = "10"
            )
            int limit
    ) {

        return ResponseEntity.ok(
                paymentService
                        .getRecentTransactions(
                                limit
                        )
        );
    }
}