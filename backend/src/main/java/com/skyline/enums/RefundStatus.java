package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum RefundStatus {
    PENDING_REVIEW("Pending Review"),
    PENDING_PAYMENT("Awaiting Payment"),
    APPROVED("Approved"),
    PROCESSED("Payment Sent – Awaiting Confirmation"),
    SENT("Payment Sent – Awaiting Confirmation"),
    COMPLETED("Refund Completed"),
    PENDING("Pending Review");

    private final String displayValue;

    RefundStatus(String displayValue) {
        this.displayValue = displayValue;
    }

    @JsonValue
    public String getDisplayValue() {
        return displayValue;
    }

    @JsonCreator
    public static RefundStatus fromString(String text) {
        if (text == null) return null;
        for (RefundStatus status : values()) {
            if (status.name().equalsIgnoreCase(text) || status.displayValue.equalsIgnoreCase(text)) {
                return status;
            }
        }
        // Common UI Aliases
        if ("Refund Pending".equalsIgnoreCase(text) || "Pending Payment".equalsIgnoreCase(text) || "Awaiting Payment".equalsIgnoreCase(text)) {
            return PENDING_PAYMENT;
        }
        if ("Pending Review".equalsIgnoreCase(text) || "Review Pending".equalsIgnoreCase(text)) {
            return PENDING_REVIEW;
        }
        if ("Payment Sent".equalsIgnoreCase(text) || "Payment Sent – Awaiting Confirmation".equalsIgnoreCase(text)
                || "Payment Sent - Awaiting Confirmation".equalsIgnoreCase(text)
                || "Awaiting Customer Confirmation".equalsIgnoreCase(text)
                || "Awaiting Confirmation".equalsIgnoreCase(text)
                || "Sent".equalsIgnoreCase(text)) {
            return PROCESSED;
        }
        if ("Refund Completed".equalsIgnoreCase(text) || "Completed".equalsIgnoreCase(text)) {
            return COMPLETED;
        }
        throw new IllegalArgumentException("Unknown refund status: " + text);
    }
}
