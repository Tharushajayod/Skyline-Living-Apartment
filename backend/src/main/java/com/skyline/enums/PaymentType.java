package com.skyline.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PaymentType {

    RESERVATION_FEE("Reservation Fee"),
    INSTALLMENT("Installment"),
    FULL_PAYMENT("Full Payment"),
    INSTALLMENT_PAYMENT("Installment Payment"),
    PART_PAYMENT("Part Payment");

    private final String displayValue;

    PaymentType(String displayValue) {
        this.displayValue = displayValue;
    }

    @JsonValue
    public String getDisplayValue() {
        return displayValue;
    }

    @JsonCreator
    public static PaymentType fromString(String text) {
        if (text == null || text.trim().isEmpty()) return null;

        String clean = text.trim();

        // Exact match by name or display value
        for (PaymentType type : values()) {
            if (type.name().equalsIgnoreCase(clean)
                    || type.displayValue.equalsIgnoreCase(clean)) {
                return type;
            }
        }

        // Normalized match
        String normalized = clean.toUpperCase().replace(" ", "_").replace("-", "_");
        for (PaymentType type : values()) {
            if (type.name().equalsIgnoreCase(normalized)) {
                return type;
            }
        }

        if (normalized.contains("INSTALLMENT")) {
            return INSTALLMENT_PAYMENT;
        }
        if (normalized.contains("PART")) {
            return PART_PAYMENT;
        }
        if (normalized.contains("RESERVATION")) {
            return RESERVATION_FEE;
        }
        if (normalized.contains("FULL")) {
            return FULL_PAYMENT;
        }

        throw new IllegalArgumentException(
                "Unknown payment type: " + text
        );
    }
}