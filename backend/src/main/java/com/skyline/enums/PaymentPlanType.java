package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PaymentPlanType {

    INSTALLMENT("Installment Plan"),
    PART_PAYMENT("Part Payment Plan");

    private final String displayValue;

    PaymentPlanType(String displayValue) {
        this.displayValue = displayValue;
    }

    @JsonValue
    public String getDisplayValue() {
        return displayValue;
    }

    @JsonCreator
    public static PaymentPlanType fromString(String text) {
        if (text == null) return null;

        for (PaymentPlanType type : values()) {
            if (type.name().equalsIgnoreCase(text)
                    || type.displayValue.equalsIgnoreCase(text)) {
                return type;
            }
        }

        throw new IllegalArgumentException(
                "Unknown payment plan type: " + text
        );
    }
}