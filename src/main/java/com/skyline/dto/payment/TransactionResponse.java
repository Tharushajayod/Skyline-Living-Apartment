package com.skyline.dto.payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransactionResponse {

    private Long transactionId;
    private Long paymentId;

    private String transactionNumber;
    private String transactionType;
    private String transactionStatus;

    private BigDecimal transactionAmount;

    private LocalDateTime processedDate;

    private String receiptNumber;
    private String bankReference;
    private String gatewayReference;
    private String chequeNumber;

    private Long processedByStaffId;
    private String processedByName;

    private String failureReason;
    private String remarks;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TransactionResponse() {
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(
            Long transactionId
    ) {
        this.transactionId =
                transactionId;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(
            Long paymentId
    ) {
        this.paymentId = paymentId;
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

    public String getTransactionStatus() {
        return transactionStatus;
    }

    public void setTransactionStatus(
            String transactionStatus
    ) {
        this.transactionStatus =
                transactionStatus;
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

    public LocalDateTime getProcessedDate() {
        return processedDate;
    }

    public void setProcessedDate(
            LocalDateTime processedDate
    ) {
        this.processedDate =
                processedDate;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(
            String receiptNumber
    ) {
        this.receiptNumber =
                receiptNumber;
    }

    public String getBankReference() {
        return bankReference;
    }

    public void setBankReference(
            String bankReference
    ) {
        this.bankReference =
                bankReference;
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
        this.chequeNumber =
                chequeNumber;
    }

    public Long getProcessedByStaffId() {
        return processedByStaffId;
    }

    public void setProcessedByStaffId(
            Long processedByStaffId
    ) {
        this.processedByStaffId =
                processedByStaffId;
    }

    public String getProcessedByName() {
        return processedByName;
    }

    public void setProcessedByName(
            String processedByName
    ) {
        this.processedByName =
                processedByName;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(
            String failureReason
    ) {
        this.failureReason =
                failureReason;
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