package com.skyline.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ApartmentStatus {
    AVAILABLE("Available"),
    RESERVED("Reserved"),
    SOLD("Sold");

    private final String displayValue;

    ApartmentStatus(String displayValue) {
        this.displayValue = displayValue;
    }

    @JsonValue
    public String getDisplayValue() {
        return displayValue;
    }

    @JsonCreator
    public static ApartmentStatus fromString(String value) {
        if (value == null) return null;
        for (ApartmentStatus status : values()) {
            if (status.name().equalsIgnoreCase(value) || status.displayValue.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown apartment status: " + value);
    }
}