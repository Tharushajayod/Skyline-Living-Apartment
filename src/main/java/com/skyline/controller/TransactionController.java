package com.skyline.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skyline.dto.payment.CreateTransactionRequest;
import com.skyline.dto.payment.TransactionResponse;
import com.skyline.dto.payment.UpdateTransactionStatusRequest;
import com.skyline.service.TransactionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService
            transactionService;

    public TransactionController(
            TransactionService transactionService
    ) {
        this.transactionService =
                transactionService;
    }

    @PostMapping
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<TransactionResponse>
    createTransaction(
            @Valid
            @RequestBody
            CreateTransactionRequest request
    ) {

        TransactionResponse response =
                transactionService
                        .createTransaction(
                                request
                        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/{transactionId}")
    @PreAuthorize(
            "hasAnyRole('CUSTOMER', 'FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<TransactionResponse>
    getTransactionById(
            @PathVariable
            Long transactionId
    ) {

        return ResponseEntity.ok(
                transactionService
                        .getTransactionById(
                                transactionId
                        )
        );
    }

    @GetMapping
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<List<TransactionResponse>>
    getAllTransactions() {

        return ResponseEntity.ok(
                transactionService
                        .getAllTransactions()
        );
    }

    @GetMapping("/number/{transactionNumber}")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<TransactionResponse>
    getTransactionByNumber(
            @PathVariable
            String transactionNumber
    ) {

        return ResponseEntity.ok(
                transactionService
                        .getTransactionByNumber(
                                transactionNumber
                        )
        );
    }

    @GetMapping("/payment/{paymentId}")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<List<TransactionResponse>>
    getTransactionsByPayment(
            @PathVariable
            Long paymentId
    ) {

        return ResponseEntity.ok(
                transactionService
                        .getTransactionsByPayment(
                                paymentId
                        )
        );
    }

    @GetMapping("/status/{status}")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<List<TransactionResponse>>
    getTransactionsByStatus(
            @PathVariable
            String status
    ) {

        return ResponseEntity.ok(
                transactionService
                        .getTransactionsByStatus(
                                status
                        )
        );
    }

    @PatchMapping("/{transactionId}/status")
    @PreAuthorize(
            "hasAnyRole('FINANCE_OFFICER', 'ADMIN')"
    )
    public ResponseEntity<TransactionResponse>
    updateTransactionStatus(
            @PathVariable
            Long transactionId,

            @Valid
            @RequestBody
            UpdateTransactionStatusRequest request
    ) {

        return ResponseEntity.ok(
                transactionService
                        .updateTransactionStatus(
                                transactionId,
                                request
                        )
        );
    }

    @DeleteMapping("/{transactionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void>
    deleteTransaction(
            @PathVariable
            Long transactionId
    ) {

        transactionService
                .deleteTransaction(
                        transactionId
                );

        return ResponseEntity
                .noContent()
                .build();
    }

    @GetMapping("/my-transactions")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<TransactionResponse>>
    getMyTransactions(
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                transactionService
                        .getMyTransactions(
                                authentication
                                        .getName()
                        )
        );
    }
}