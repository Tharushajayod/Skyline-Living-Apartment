package com.skyline.dto;

import java.time.LocalDate;

public record StaffSummaryResponse(

        Long staffId,
        Long userId,
        String fullName,
        String email,
        String phone,
        String employeeNumber,
        String department,
        String designation,
        String role,
        String status,
        LocalDate hireDate

) {
}