package com.skyline.dto;

import java.time.LocalDate;

public record StaffResponse(

        Long userId,
        Long staffId,
        String fullName,
        String email,
        String phone,
        String employeeNumber,
        String department,
        String designation,
        String role,
        String status,
        LocalDate hireDate,
        String message

) {
}