package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PaymentPlanItemStatus {

    UPCOMING("Upcoming"),
    PENDING_VERIFICATION("Pending Verification"),
    PAID("Paid");

    private final String displayValue;

    PaymentPlanItemStatus(String displayValue) {
        this.displayValue = displayValue;
    }

    @JsonValue
    public String getDisplayValue() {
        return displayValue;
    }

    @JsonCreator
    public static PaymentPlanItemStatus fromValue(String value) {
        if (value == null) return null;

        for (PaymentPlanItemStatus status : values()) {
            if (status.name().equalsIgnoreCase(value)
                    || status.displayValue.equalsIgnoreCase(value)) {
                return status;
            }
        }

        throw new IllegalArgumentException(
                "Unknown payment plan item status: " + value
        );
    }
}