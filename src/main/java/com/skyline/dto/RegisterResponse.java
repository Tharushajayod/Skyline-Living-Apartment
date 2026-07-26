package com.skyline.dto;

public record RegisterResponse(
        Long userId,
        Long customerId,
        String fullName,
        String email,
        String role,
        String message
) {
}