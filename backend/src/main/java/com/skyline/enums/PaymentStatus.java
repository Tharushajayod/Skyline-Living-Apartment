package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PaymentStatus {

    PENDING("Pending"),
    VERIFIED("Verified"),
    REJECTED("Rejected");

    private final String displayValue;

    PaymentStatus(String displayValue) {
        this.displayValue = displayValue;
    }

    @JsonValue
    public String getDisplayValue() {
        return displayValue;
    }

    @JsonCreator
    public static PaymentStatus fromString(String text) {
        if (text == null) return null;

        for (PaymentStatus status : values()) {
            if (status.name().equalsIgnoreCase(text)
                    || status.displayValue.equalsIgnoreCase(text)) {
                return status;
            }
        }

        throw new IllegalArgumentException(
                "Unknown payment status: " + text
        );
    }
}