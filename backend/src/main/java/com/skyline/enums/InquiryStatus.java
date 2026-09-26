package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum InquiryStatus {
    PENDING("Pending"),
    IN_PROGRESS("In Progress"),
    RESOLVED("Resolved");

    private final String displayValue;

    InquiryStatus(String displayValue) {
        this.displayValue = displayValue;
    }

    @JsonValue
    public String getDisplayValue() {
        return displayValue;
    }

    @JsonCreator
    public static InquiryStatus fromString(String text) {
        if (text == null) return null;
        for (InquiryStatus status : values()) {
            if (status.name().equalsIgnoreCase(text) || status.displayValue.equalsIgnoreCase(text)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown inquiry status: " + text);
    }
}
