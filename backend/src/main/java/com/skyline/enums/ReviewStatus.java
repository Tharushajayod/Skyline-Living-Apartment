package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ReviewStatus {
    PENDING("Pending"),
    PUBLISHED("Published"),
    HIDDEN("Hidden");

    private final String displayValue;

    ReviewStatus(String displayValue) {
        this.displayValue = displayValue;
    }

    @JsonValue
    public String getDisplayValue() {
        return displayValue;
    }

    @JsonCreator
    public static ReviewStatus fromString(String text) {
        if (text == null) return null;
        for (ReviewStatus status : values()) {
            if (status.name().equalsIgnoreCase(text) || status.displayValue.equalsIgnoreCase(text)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown review status: " + text);
    }
}
