package com.skyline.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skyline.dto.payment.CreateTransactionRequest;
import com.skyline.dto.payment.TransactionResponse;
import com.skyline.dto.payment.UpdateTransactionStatusRequest;
import com.skyline.entity.Payment;
import com.skyline.entity.Staff;
import com.skyline.entity.Transaction;
import com.skyline.repository.PaymentRepository;
import com.skyline.repository.StaffRepository;
import com.skyline.repository.TransactionRepository;
import com.skyline.service.TransactionService;

import jakarta.persistence.EntityNotFoundException;

@Service
@Transactional
public class TransactionServiceImpl
        implements TransactionService {

    private static final Set<String>
            ALLOWED_STATUSES =
            Set.of(
                    "PENDING",
                    "SUCCESS",
                    "FAILED",
                    "CANCELLED",
                    "REFUNDED"
            );

    private final TransactionRepository
            transactionRepository;

    private final PaymentRepository
            paymentRepository;

    private final StaffRepository
            staffRepository;

    public TransactionServiceImpl(
            TransactionRepository transactionRepository,
            PaymentRepository paymentRepository,
            StaffRepository staffRepository
    ) {
        this.transactionRepository =
                transactionRepository;

        this.paymentRepository =
                paymentRepository;

        this.staffRepository =
                staffRepository;
    }

    @Override
    public TransactionResponse createTransaction(
            CreateTransactionRequest request
    ) {

        Payment payment = paymentRepository
                .findById(request.getPaymentId())
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Payment not found with ID: "
                                        + request.getPaymentId()
                        )
                );

        Staff processedBy =
                getCurrentStaff();

        String normalizedStatus =
                normalizeStatus(
                        request.getTransactionStatus()
                );

        if (!ALLOWED_STATUSES.contains(
                normalizedStatus
        )) {
            throw new IllegalArgumentException(
                    "Invalid transaction status"
            );
        }

        Transaction transaction =
                new Transaction();

        transaction.setPayment(payment);
        transaction.setProcessedBy(processedBy);

        transaction.setTransactionNumber(
                generateTransactionNumber()
        );

        transaction.setTransactionType(
                request.getTransactionType()
                        .trim()
                        .toUpperCase()
        );

        transaction.setTransactionStatus(
                normalizedStatus
        );

        transaction.setTransactionAmount(
                request.getTransactionAmount()
        );

        transaction.setReceiptNumber(
                normalizeNullable(
                        request.getReceiptNumber()
                )
        );

        transaction.setBankReference(
                normalizeNullable(
                        request.getBankReference()
                )
        );

        transaction.setGatewayReference(
                normalizeNullable(
                        request.getGatewayReference()
                )
        );

        transaction.setChequeNumber(
                normalizeNullable(
                        request.getChequeNumber()
                )
        );

        transaction.setProcessedDate(
                LocalDateTime.now()
        );

        Transaction saved =
                transactionRepository.save(
                        transaction
                );

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(
            Long transactionId
    ) {

        Transaction transaction =
                getTransactionEntity(
                        transactionId
                );

        return mapToResponse(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse>
    getAllTransactions() {

        return transactionRepository
                .findAllByOrderByProcessedDateDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionResponse
    getTransactionByNumber(
            String transactionNumber
    ) {

        Transaction transaction =
                transactionRepository
                        .findByTransactionNumber(
                                transactionNumber
                                        .trim()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Transaction not found"
                                )
                        );

        return mapToResponse(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse>
    getTransactionsByPayment(
            Long paymentId
    ) {

        if (!paymentRepository.existsById(
                paymentId
        )) {
            throw new EntityNotFoundException(
                    "Payment not found with ID: "
                            + paymentId
            );
        }

        return transactionRepository
                .findByPaymentPaymentId(
                        paymentId
                )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse>
    getTransactionsByStatus(
            String status
    ) {

        String normalizedStatus =
                normalizeStatus(status);

        if (!ALLOWED_STATUSES.contains(
                normalizedStatus
        )) {
            throw new IllegalArgumentException(
                    "Invalid transaction status"
            );
        }

        return transactionRepository
                .findByTransactionStatusOrderByProcessedDateDesc(
                        normalizedStatus
                )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public TransactionResponse
    updateTransactionStatus(
            Long transactionId,
            UpdateTransactionStatusRequest request
    ) {

        Transaction transaction =
                getTransactionEntity(
                        transactionId
                );

        String currentStatus =
                normalizeStatus(
                        transaction
                                .getTransactionStatus()
                );

        String newStatus =
                normalizeStatus(
                        request
                                .getTransactionStatus()
                );

        if (!ALLOWED_STATUSES.contains(
                newStatus
        )) {
            throw new IllegalArgumentException(
                    "Status must be Pending, Success, Failed, Cancelled, or Refunded"
            );
        }

        validateStatusTransition(
                currentStatus,
                newStatus
        );

        if (Set.of(
                "FAILED",
                "CANCELLED",
                "REFUNDED"
        ).contains(newStatus)) {

            if (request.getReason() == null
                    || request.getReason()
                            .isBlank()) {

                throw new IllegalArgumentException(
                        "A reason is required for "
                                + newStatus
                );
            }

            transaction.setFailureReason(
                    request.getReason().trim()
            );

        } else {
            transaction.setFailureReason(null);
        }

        transaction.setTransactionStatus(
                newStatus
        );

        if (request.getRemarks() != null
                && !request.getRemarks()
                        .isBlank()) {

            transaction.setRemarks(
                    request.getRemarks().trim()
            );
        }

        Transaction savedTransaction =
                transactionRepository.save(
                        transaction
                );

        return mapToResponse(
                savedTransaction
        );
    }

    @Override
    public void deleteTransaction(
            Long transactionId
    ) {

        Transaction transaction =
                getTransactionEntity(
                        transactionId
                );

        transactionRepository.delete(
                transaction
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse>
    getMyTransactions(
            String email
    ) {

        return transactionRepository
                .findByPaymentCustomerUserEmailOrderByProcessedDateDesc(
                        email.trim()
                                .toLowerCase()
                )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private void validateStatusTransition(
            String currentStatus,
            String newStatus
    ) {

        if (currentStatus.equals(newStatus)) {
            throw new IllegalArgumentException(
                    "Transaction already has the selected status"
            );
        }

        boolean validTransition =
                switch (currentStatus) {

                    case "PENDING" ->
                            Set.of(
                                    "SUCCESS",
                                    "FAILED",
                                    "CANCELLED"
                            ).contains(newStatus);

                    case "SUCCESS" ->
                            "REFUNDED".equals(
                                    newStatus
                            );

                    case "FAILED",
                         "CANCELLED",
                         "REFUNDED" ->
                            false;

                    default -> false;
                };

        if (!validTransition) {
            throw new IllegalArgumentException(
                    "Transaction cannot be changed from "
                            + currentStatus
                            + " to "
                            + newStatus
            );
        }
    }

    private Transaction getTransactionEntity(
            Long transactionId
    ) {

        return transactionRepository
                .findById(transactionId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Transaction not found with ID: "
                                        + transactionId
                        )
                );
    }

    private Staff getCurrentStaff() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(
                        authentication.getPrincipal()
                )) {

            throw new IllegalStateException(
                    "Authenticated staff member is required"
            );
        }

        String email =
                authentication.getName()
                        .trim()
                        .toLowerCase();

        return staffRepository
                .findByUserEmail(email)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Staff record not found for logged-in user: "
                                        + email
                        )
                );
    }

    private TransactionResponse mapToResponse(
            Transaction transaction
    ) {

        TransactionResponse response =
                new TransactionResponse();

        response.setTransactionId(
                transaction.getTransactionId()
        );

        if (transaction.getPayment() != null) {
            response.setPaymentId(
                    transaction.getPayment()
                            .getPaymentId()
            );
        }

        response.setTransactionNumber(
                transaction.getTransactionNumber()
        );

        response.setTransactionType(
                transaction.getTransactionType()
        );

        response.setTransactionStatus(
                transaction.getTransactionStatus()
        );

        response.setTransactionAmount(
                transaction.getTransactionAmount()
        );

        response.setProcessedDate(
                transaction.getProcessedDate()
        );

        response.setReceiptNumber(
                transaction.getReceiptNumber()
        );

        response.setBankReference(
                transaction.getBankReference()
        );

        response.setGatewayReference(
                transaction.getGatewayReference()
        );

        response.setChequeNumber(
                transaction.getChequeNumber()
        );

        response.setFailureReason(
                transaction.getFailureReason()
        );

        response.setRemarks(
                transaction.getRemarks()
        );

        response.setCreatedAt(
                transaction.getCreatedAt()
        );

        response.setUpdatedAt(
                transaction.getUpdatedAt()
        );

        if (transaction.getProcessedBy() != null) {

            response.setProcessedByStaffId(
                    transaction.getProcessedBy()
                            .getStaffId()
            );

            if (transaction.getProcessedBy()
                    .getUser() != null) {

                response.setProcessedByName(
                        transaction.getProcessedBy()
                                .getUser()
                                .getFullName()
                );
            }
        }

        return response;
    }

    private String generateTransactionNumber() {

        return "TXN-"
                + UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 10)
                        .toUpperCase();
    }

    private String normalizeStatus(
            String value
    ) {

        if (value == null
                || value.isBlank()) {
            throw new IllegalArgumentException(
                    "Transaction status is required"
            );
        }

        return value.trim().toUpperCase();
    }

    private String normalizeNullable(
            String value
    ) {

        if (value == null
                || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}