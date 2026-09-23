package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum RefundType {
    CANCELLATION("Cancellation"),
    EXPIRATION("Expiration");

    private final String displayValue;

    RefundType(String displayValue) {
        this.displayValue = displayValue;
    }

    @JsonValue
    public String getDisplayValue() {
        return displayValue;
    }

    @JsonCreator
    public static RefundType fromString(String text) {
        if (text == null) return null;
        for (RefundType type : values()) {
            if (type.name().equalsIgnoreCase(text) || type.displayValue.equalsIgnoreCase(text)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown refund type: " + text);
    }
}
