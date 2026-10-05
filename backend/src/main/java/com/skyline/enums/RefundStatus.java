package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum RefundStatus {
    PENDING_REVIEW("Pending Review"),
    PENDING_PAYMENT("Awaiting Payment"),
    APPROVED("Approved"),
    PROCESSED("Processed"),
    COMPLETED("Completed"),
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
        throw new IllegalArgumentException("Unknown refund status: " + text);
    }
}
