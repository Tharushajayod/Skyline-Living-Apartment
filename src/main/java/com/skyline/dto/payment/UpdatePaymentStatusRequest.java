package com.skyline.dto.payment;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;

public class UpdatePaymentStatusRequest {

    private String paymentStatus;
    private String rejectionReason;

    @DecimalMin(
            value = "0.01",
            message = "Paid amount must be greater than zero"
    )
    private BigDecimal paidAmount;

    public UpdatePaymentStatusRequest() {
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(
            String paymentStatus
    ) {
        this.paymentStatus = paymentStatus;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(
            String rejectionReason
    ) {
        this.rejectionReason =
                rejectionReason;
    }

    public BigDecimal getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(
            BigDecimal paidAmount
    ) {
        this.paidAmount = paidAmount;
    }
}