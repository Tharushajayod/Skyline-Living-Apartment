package com.skyline.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skyline.dto.payment.CreateTransactionRequest;
import com.skyline.dto.payment.TransactionResponse;
import com.skyline.service.TransactionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(
            @Valid @RequestBody CreateTransactionRequest request) {
    
        TransactionResponse response =
                transactionService.createTransaction(request);
    
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionResponse> getTransactionById(
            @PathVariable Long transactionId) {

        return ResponseEntity.ok(
                transactionService.getTransactionById(transactionId));
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getAllTransactions() {

        return ResponseEntity.ok(
                transactionService.getAllTransactions());
    }

    @GetMapping("/number/{transactionNumber}")
    public ResponseEntity<TransactionResponse> getTransactionByNumber(
            @PathVariable String transactionNumber) {

        return ResponseEntity.ok(
                transactionService.getTransactionByNumber(transactionNumber));
    }

    @GetMapping("/payment/{paymentId}")
    public ResponseEntity<List<TransactionResponse>> getTransactionsByPayment(
            @PathVariable Long paymentId) {

        return ResponseEntity.ok(
                transactionService.getTransactionsByPayment(paymentId));
    }

    @DeleteMapping("/{transactionId}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long transactionId) {

        transactionService.deleteTransaction(transactionId);

        return ResponseEntity.noContent().build();
    }
}