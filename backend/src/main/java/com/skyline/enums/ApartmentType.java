package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ApartmentType {
    STUDIO("Studio"),
    ONE_BEDROOM("1BR"),
    TWO_BEDROOM("2BR"),
    THREE_BEDROOM("3BR"),
    PENTHOUSE("Penthouse");

    private final String displayValue;

    ApartmentType(String displayValue) {
        this.displayValue = displayValue;
    }

    @JsonValue
    public String getDisplayValue() {
        return displayValue;
    }

    @JsonCreator
    public static ApartmentType fromString(String text) {
        if (text == null) return null;
        for (ApartmentType type : values()) {
            if (type.name().equalsIgnoreCase(text) || type.displayValue.equalsIgnoreCase(text)) {
                return type;
            }
        }
        // Handle common variations
        if ("1 Bedroom".equalsIgnoreCase(text)) return ONE_BEDROOM;
        if ("2 Bedroom".equalsIgnoreCase(text)) return TWO_BEDROOM;
        if ("3 Bedroom".equalsIgnoreCase(text)) return THREE_BEDROOM;
        throw new IllegalArgumentException("Unknown apartment type: " + text);
    }
}
