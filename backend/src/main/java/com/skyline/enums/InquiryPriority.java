package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum InquiryPriority {
    LOW("Low"),
    MEDIUM("Medium"),
    HIGH("High");

    private final String displayValue;

    InquiryPriority(String displayValue) {
        this.displayValue = displayValue;
    }

    @JsonValue
    public String getDisplayValue() {
        return displayValue;
    }

    @JsonCreator
    public static InquiryPriority fromString(String text) {
        if (text == null) return null;
        for (InquiryPriority prio : values()) {
            if (prio.name().equalsIgnoreCase(text) || prio.displayValue.equalsIgnoreCase(text)) {
                return prio;
            }
        }
        throw new IllegalArgumentException("Unknown inquiry priority: " + text);
    }
}
