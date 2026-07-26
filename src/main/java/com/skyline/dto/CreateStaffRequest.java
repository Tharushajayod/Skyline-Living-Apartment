package com.skyline.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStaffRequest(

        @NotBlank(message = "Full name is required")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Email address is invalid")
        String email,

        @NotBlank(message = "Password is required")
        @Size(
                min = 8,
                message = "Password must contain at least 8 characters"
        )
        String password,

        @NotBlank(message = "Phone number is required")
        String phone,

        @NotBlank(message = "Employee number is required")
        String employeeNumber,

        @NotBlank(message = "Department is required")
        String department,

        @NotBlank(message = "Designation is required")
        String designation,

        @NotBlank(message = "Staff role is required")
        String role,

        LocalDate hireDate

) {
}