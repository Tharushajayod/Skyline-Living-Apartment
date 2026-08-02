package com.skyline.service.impl;

import com.skyline.entity.Staff;
import com.skyline.repository.StaffRepository;
import com.skyline.dto.payment.CreateTransactionRequest;
import com.skyline.dto.payment.TransactionResponse;
import com.skyline.entity.Payment;
import com.skyline.entity.Transaction;
import com.skyline.repository.PaymentRepository;
import com.skyline.repository.TransactionRepository;
import com.skyline.service.TransactionService;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final PaymentRepository paymentRepository;
    private final StaffRepository staffRepository;

    public TransactionServiceImpl(TransactionRepository transactionRepository,
                                  PaymentRepository paymentRepository,
                                  StaffRepository staffRepository) {

        this.transactionRepository = transactionRepository;
        this.paymentRepository = paymentRepository;
        this.staffRepository = staffRepository;
    }

    @Override
    public TransactionResponse createTransaction(CreateTransactionRequest request) {

        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Payment not found with ID: " + request.getPaymentId()));

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {

            throw new IllegalStateException(
                    "Authenticated staff member is required"
            );
        }

        String loggedInEmail = authentication.getName();

        Staff processedBy = staffRepository.findByUserEmail(loggedInEmail)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Staff record not found for logged-in user: " + loggedInEmail
                ));

        Transaction transaction = new Transaction();

        transaction.setPayment(payment);
        transaction.setProcessedBy(processedBy);
        transaction.setTransactionNumber(generateTransactionNumber());
        transaction.setTransactionType(request.getTransactionType());
        transaction.setTransactionStatus(request.getTransactionStatus());
        transaction.setTransactionAmount(request.getTransactionAmount());
        transaction.setReceiptNumber(request.getReceiptNumber());
        transaction.setBankReference(request.getBankReference());
        transaction.setGatewayReference(request.getGatewayReference());
        transaction.setChequeNumber(request.getChequeNumber());
        transaction.setProcessedDate(LocalDateTime.now());

        Transaction saved = transactionRepository.save(transaction);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(Long transactionId) {

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Transaction not found with ID: " + transactionId));

        return mapToResponse(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse> getAllTransactions() {

        return transactionRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionResponse getTransactionByNumber(String transactionNumber) {

        Transaction transaction = transactionRepository
                .findByTransactionNumber(transactionNumber)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Transaction not found"));

        return mapToResponse(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsByPayment(Long paymentId) {

        return transactionRepository.findByPaymentPaymentId(paymentId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public void deleteTransaction(Long transactionId) {

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Transaction not found"));

        transactionRepository.delete(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse> getMyTransactions(
            String email
    ) {

        return transactionRepository
                .findByPaymentCustomerUserEmailOrderByProcessedDateDesc(
                        email.trim().toLowerCase()
                )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private TransactionResponse mapToResponse(Transaction transaction) {

        TransactionResponse response = new TransactionResponse();

        response.setTransactionId(transaction.getTransactionId());

        if (transaction.getPayment() != null) {
            response.setPaymentId(transaction.getPayment().getPaymentId());
        }

        response.setTransactionNumber(transaction.getTransactionNumber());
        response.setTransactionType(transaction.getTransactionType());
        response.setTransactionStatus(transaction.getTransactionStatus());
        response.setTransactionAmount(transaction.getTransactionAmount());
        response.setProcessedDate(transaction.getProcessedDate());

        response.setReceiptNumber(transaction.getReceiptNumber());
        response.setBankReference(transaction.getBankReference());
        response.setGatewayReference(transaction.getGatewayReference());
        response.setChequeNumber(transaction.getChequeNumber());

        return response;
    }

    private String generateTransactionNumber() {

        return "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}