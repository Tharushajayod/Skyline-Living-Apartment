package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum NotificationType {
    APPOINTMENT("appointment"),
    RESERVATION("reservation"),
    PAYMENT("payment"),
    INQUIRY("inquiry"),
    GENERAL("general");

    private final String value;

    NotificationType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static NotificationType fromString(String text) {
        if (text == null) return null;
        for (NotificationType type : values()) {
            if (type.name().equalsIgnoreCase(text) || type.value.equalsIgnoreCase(text)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown notification type: " + text);
    }
}
