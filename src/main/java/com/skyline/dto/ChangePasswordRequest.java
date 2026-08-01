package com.skyline.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(

        @NotBlank(message = "Current password is required")
        String currentPassword,

        @NotBlank(message = "New password is required")
        @Size(
                min = 8,
                max = 100,
                message = "New password must contain between 8 and 100 characters"
        )
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$%^&+=!]).{8,100}$",
                message = "Password must contain uppercase, lowercase, number and special character"
        )
        String newPassword,

        @NotBlank(message = "Confirm password is required")
        String confirmPassword

) {
}