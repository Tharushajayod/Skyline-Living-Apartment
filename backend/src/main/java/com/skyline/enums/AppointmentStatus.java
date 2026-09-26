package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum AppointmentStatus {
    PENDING("Pending"),
    APPROVED("Approved"),
    REJECTED("Rejected"),
    RESCHEDULED("Rescheduled"),
    COMPLETED("Completed"),
    NO_SHOW("No-show"),
    CANCELLED("Cancelled");

    private final String displayValue;

    AppointmentStatus(String displayValue) {
        this.displayValue = displayValue;
    }

    @JsonValue
    public String getDisplayValue() {
        return displayValue;
    }

    @JsonCreator
    public static AppointmentStatus fromString(String text) {
        if (text == null) return null;
        for (AppointmentStatus status : values()) {
            if (status.name().equalsIgnoreCase(text) || status.displayValue.equalsIgnoreCase(text)) {
                return status;
            }
        }
        if ("No show".equalsIgnoreCase(text) || "NOSHOW".equalsIgnoreCase(text)) return NO_SHOW;
        throw new IllegalArgumentException("Unknown appointment status: " + text);
    }
}
