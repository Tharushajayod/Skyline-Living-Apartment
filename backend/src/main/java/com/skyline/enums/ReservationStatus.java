package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ReservationStatus {
    PENDING("Pending"),
    CONFIRMED("Confirmed"),
    EXPIRED("Expired"),
    CANCELLED("Cancelled");

    private final String displayValue;

    ReservationStatus(String displayValue) {
        this.displayValue = displayValue;
    }

    @JsonValue
    public String getDisplayValue() {
        return displayValue;
    }

    @JsonCreator
    public static ReservationStatus fromString(String text) {
        if (text == null) return null;
        for (ReservationStatus status : values()) {
            if (status.name().equalsIgnoreCase(text) || status.displayValue.equalsIgnoreCase(text)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown reservation status: " + text);
    }
}
