package com.skyline.util;

import com.skyline.exception.BadRequestException;

public final class IdParser {

    private IdParser() {}

    public static Long parseId(String idStr) {
        if (idStr == null || idStr.trim().isEmpty() || "undefined".equalsIgnoreCase(idStr.trim()) || "null".equalsIgnoreCase(idStr.trim())) {
            throw new BadRequestException("Please select a valid apartment");
        }
        String clean = idStr.trim();
        // If it contains non-digits like APT-001, extract digits
        if (!clean.matches("^\\d+$")) {
            String digits = clean.replaceAll("\\D+", "");
            if (digits.isEmpty()) {
                throw new BadRequestException("Please select a valid apartment");
            }
            return Long.parseLong(digits);
        }
        return Long.parseLong(clean);
    }

    public static String formatId(String prefix, Long id) {
        if (id == null) return null;
        return String.format("%s-%03d", prefix, id);
    }
}
