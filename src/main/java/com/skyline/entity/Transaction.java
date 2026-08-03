package com.skyline.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "payment_id",
            nullable = false
    )
    private Payment payment;

    @Column(
            name = "transaction_number",
            nullable = false,
            unique = true,
            length = 50
    )
    private String transactionNumber;

    @Column(
            name = "transaction_type",
            nullable = false,
            length = 30
    )
    private String transactionType;

    @Column(
            name = "transaction_amount",
            nullable = false,
            precision = 18,
            scale = 2
    )
    private BigDecimal transactionAmount;

    @Column(
            name = "transaction_status",
            nullable = false,
            length = 30
    )
    private String transactionStatus;

    @Column(
            name = "receipt_number",
            unique = true,
            length = 100
    )
    private String receiptNumber;

    @Column(
            name = "bank_reference",
            length = 100
    )
    private String bankReference;

    @Column(
            name = "gateway_reference",
            length = 150
    )
    private String gatewayReference;

    @Column(
            name = "cheque_number",
            length = 100
    )
    private String chequeNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "processed_by",
            nullable = false
    )
    private Staff processedBy;

    @Column(
            name = "processed_at",
            nullable = false
    )
    private LocalDateTime processedDate;

    @Column(
            name = "failure_reason",
            length = 255
    )
    private String failureReason;

    @Column(
            name = "remarks",
            length = 255
    )
    private String remarks;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

    @Column(
            name = "updated_at",
            nullable = false
    )
    private LocalDateTime updatedAt;

    public Transaction() {
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime now =
                LocalDateTime.now();

        if (processedDate == null) {
            processedDate = now;
        }

        if (createdAt == null) {
            createdAt = now;
        }

        if (updatedAt == null) {
            updatedAt = now;
        }

        if (transactionStatus == null
                || transactionStatus.isBlank()) {
            transactionStatus = "PENDING";
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(
            Long transactionId
    ) {
        this.transactionId = transactionId;
    }

    public Payment getPayment() {
        return payment;
    }

    public void setPayment(
            Payment payment
    ) {
        this.payment = payment;
    }

    public String getTransactionNumber() {
        return transactionNumber;
    }

    public void setTransactionNumber(
            String transactionNumber
    ) {
        this.transactionNumber =
                transactionNumber;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(
            String transactionType
    ) {
        this.transactionType =
                transactionType;
    }

    public BigDecimal getTransactionAmount() {
        return transactionAmount;
    }

    public void setTransactionAmount(
            BigDecimal transactionAmount
    ) {
        this.transactionAmount =
                transactionAmount;
    }

    public String getTransactionStatus() {
        return transactionStatus;
    }

    public void setTransactionStatus(
            String transactionStatus
    ) {
        this.transactionStatus =
                transactionStatus;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(
            String receiptNumber
    ) {
        this.receiptNumber = receiptNumber;
    }

    public String getBankReference() {
        return bankReference;
    }

    public void setBankReference(
            String bankReference
    ) {
        this.bankReference = bankReference;
    }

    public String getGatewayReference() {
        return gatewayReference;
    }

    public void setGatewayReference(
            String gatewayReference
    ) {
        this.gatewayReference =
                gatewayReference;
    }

    public String getChequeNumber() {
        return chequeNumber;
    }

    public void setChequeNumber(
            String chequeNumber
    ) {
        this.chequeNumber = chequeNumber;
    }

    public Staff getProcessedBy() {
        return processedBy;
    }

    public void setProcessedBy(
            Staff processedBy
    ) {
        this.processedBy = processedBy;
    }

    public LocalDateTime getProcessedDate() {
        return processedDate;
    }

    public void setProcessedDate(
            LocalDateTime processedDate
    ) {
        this.processedDate = processedDate;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(
            String failureReason
    ) {
        this.failureReason = failureReason;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(
            String remarks
    ) {
        this.remarks = remarks;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(
            LocalDateTime createdAt
    ) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(
            LocalDateTime updatedAt
    ) {
        this.updatedAt = updatedAt;
    }
}