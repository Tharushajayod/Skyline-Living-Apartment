package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PaymentPlanStatus {

    PENDING("Pending"),
    APPROVED("Approved"),
    REJECTED("Rejected"),
    COMPLETED("Completed"),
    CANCELLED("Cancelled");

    private final String displayValue;

    PaymentPlanStatus(String displayValue) {
        this.displayValue = displayValue;
    }

    @JsonValue
    public String getDisplayValue() {
        return displayValue;
    }

    @JsonCreator
    public static PaymentPlanStatus fromString(String text) {
        if (text == null) return null;

        for (PaymentPlanStatus status : values()) {
            if (status.name().equalsIgnoreCase(text)
                    || status.displayValue.equalsIgnoreCase(text)) {
                return status;
            }
        }

        throw new IllegalArgumentException(
                "Unknown payment plan status: " + text
        );
    }
}