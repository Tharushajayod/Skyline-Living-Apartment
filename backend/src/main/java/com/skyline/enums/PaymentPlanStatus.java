package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PaymentPlanStatus {

    PENDING("Pending"),
    AWAITING_CUSTOMER("Plan Ready for Confirmation"),
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
                    || status.displayValue.equalsIgnoreCase(text)
                    || (status == AWAITING_CUSTOMER && (
                        text.equalsIgnoreCase("Terms Proposed")
                        || text.equalsIgnoreCase("Awaiting Confirmation")
                        || text.equalsIgnoreCase("AWAITING_CUSTOMER")
                        || text.equalsIgnoreCase("Plan Ready for Confirmation")
                    ))) {
                return status;
            }
        }

        throw new IllegalArgumentException(
                "Unknown payment plan status: " + text
        );
    }
}