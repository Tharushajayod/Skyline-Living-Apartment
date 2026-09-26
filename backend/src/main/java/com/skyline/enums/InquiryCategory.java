package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum InquiryCategory {
    PRICING("Pricing"),
    AVAILABILITY("Availability"),
    VIEWING("Viewing"),
    FINANCING("Financing"),
    GENERAL("General");

    private final String displayValue;

    InquiryCategory(String displayValue) {
        this.displayValue = displayValue;
    }

    @JsonValue
    public String getDisplayValue() {
        return displayValue;
    }

    @JsonCreator
    public static InquiryCategory fromString(String text) {
        if (text == null) return null;
        for (InquiryCategory cat : values()) {
            if (cat.name().equalsIgnoreCase(text) || cat.displayValue.equalsIgnoreCase(text)) {
                return cat;
            }
        }
        throw new IllegalArgumentException("Unknown inquiry category: " + text);
    }
}
