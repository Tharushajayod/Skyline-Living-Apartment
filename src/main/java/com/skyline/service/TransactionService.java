package com.skyline.service;

import java.util.List;

import com.skyline.dto.payment.CreateTransactionRequest;
import com.skyline.dto.payment.TransactionResponse;
import com.skyline.dto.payment.UpdateTransactionStatusRequest;

public interface TransactionService {

    TransactionResponse createTransaction(
            CreateTransactionRequest request
    );

    TransactionResponse getTransactionById(
            Long transactionId
    );

    TransactionResponse getTransactionByNumber(
            String transactionNumber
    );

    List<TransactionResponse> getAllTransactions();

    List<TransactionResponse> getTransactionsByPayment(
            Long paymentId
    );

    List<TransactionResponse> getTransactionsByStatus(
            String status
    );

    List<TransactionResponse> getMyTransactions(
            String email
    );

    TransactionResponse updateTransactionStatus(
            Long transactionId,
            UpdateTransactionStatusRequest request
    );

    void deleteTransaction(
            Long transactionId
    );
}