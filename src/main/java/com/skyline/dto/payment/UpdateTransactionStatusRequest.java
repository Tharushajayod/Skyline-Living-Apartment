package com.skyline.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateTransactionStatusRequest {

    @NotBlank(message = "Transaction status is required")
    private String transactionStatus;

    @Size(
            max = 255,
            message = "Reason must not exceed 255 characters"
    )
    private String reason;

    @Size(
            max = 255,
            message = "Remarks must not exceed 255 characters"
    )
    private String remarks;

    public UpdateTransactionStatusRequest() {
    }

    public String getTransactionStatus() {
        return transactionStatus;
    }

    public void setTransactionStatus(
            String transactionStatus
    ) {
        this.transactionStatus = transactionStatus;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(
            String reason
    ) {
        this.reason = reason;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(
            String remarks
    ) {
        this.remarks = remarks;
    }
}