package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum RefundStatus {
    PENDING("Pending"),
    APPROVED("Approved"),
    PROCESSED("Processed");

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
        throw new IllegalArgumentException("Unknown refund status: " + text);
    }
}
