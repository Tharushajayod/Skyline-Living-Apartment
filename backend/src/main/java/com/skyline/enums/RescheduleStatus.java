package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum RescheduleStatus {
    NONE("None"),
    PENDING_CUSTOMER("Pending Customer"),
    PENDING_ADMIN("Pending Admin");

    private final String displayValue;

    RescheduleStatus(String displayValue) {
        this.displayValue = displayValue;
    }

    @JsonValue
    public String getDisplayValue() {
        return displayValue;
    }

    @JsonCreator
    public static RescheduleStatus fromString(String text) {
        if (text == null || text.trim().isEmpty()) return NONE;
        for (RescheduleStatus status : values()) {
            if (status.name().equalsIgnoreCase(text) || 
                status.displayValue.equalsIgnoreCase(text) ||
                status.name().replace("_", "").equalsIgnoreCase(text.replace(" ", "").replace("_", ""))) {
                return status;
            }
        }
        return NONE;
    }
}
