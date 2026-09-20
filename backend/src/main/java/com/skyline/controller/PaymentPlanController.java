package com.skyline.controller;

import com.skyline.dto.payment.PaymentPlanDecisionRequest;
import com.skyline.dto.payment.PaymentPlanRequest;
import com.skyline.dto.payment.PaymentPlanResponse;
import com.skyline.security.UserPrincipal;
import com.skyline.service.PaymentPlanService;
import com.skyline.util.IdParser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment-plans")
public class PaymentPlanController {

    private final PaymentPlanService paymentPlanService;

    public PaymentPlanController(
            PaymentPlanService paymentPlanService
    ) {
        this.paymentPlanService = paymentPlanService;
    }

    @GetMapping
    public ResponseEntity<List<PaymentPlanResponse>> getPlans(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(
                    required = false,
                    name = "customer"
            ) String customer
    ) {

        return ResponseEntity.ok(
                paymentPlanService.getPlans(
                        principal,
                        customer
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentPlanResponse> getPlan(
            @PathVariable String id
    ) {

        return ResponseEntity.ok(
                paymentPlanService.getPlanById(
                        IdParser.parseId(id)
                )
        );
    }

    @PostMapping
    public ResponseEntity<PaymentPlanResponse> createPlan(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PaymentPlanRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        paymentPlanService.createPlan(
                                principal,
                                request
                        )
                );
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<PaymentPlanResponse> approvePlan(
            @PathVariable String id,
            @RequestBody(required = false)
            PaymentPlanDecisionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        return ResponseEntity.ok(
                paymentPlanService.approvePlan(
                        IdParser.parseId(id),
                        request,
                        principal
                )
        );
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<PaymentPlanResponse> rejectPlan(
            @PathVariable String id,
            @RequestBody(required = false)
            PaymentPlanDecisionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        return ResponseEntity.ok(
                paymentPlanService.rejectPlan(
                        IdParser.parseId(id),
                        request,
                        principal
                )
        );
    }
}