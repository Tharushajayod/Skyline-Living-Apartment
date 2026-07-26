package com.skyline.dto;

public record LoginResponse(

        Long userId,
        String fullName,
        String email,
        String role,
        String token,
        String tokenType,
        String message

) {
}