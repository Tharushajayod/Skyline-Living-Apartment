package com.skyline.service;

import com.skyline.dto.payment.CreateTransactionRequest;
import com.skyline.dto.payment.TransactionResponse;

import java.util.List;

public interface TransactionService {

    TransactionResponse createTransaction(CreateTransactionRequest request);

    TransactionResponse getTransactionById(Long transactionId);

    List<TransactionResponse> getAllTransactions();

    TransactionResponse getTransactionByNumber(String transactionNumber);

    List<TransactionResponse> getTransactionsByPayment(Long paymentId);

    void deleteTransaction(Long transactionId);
}