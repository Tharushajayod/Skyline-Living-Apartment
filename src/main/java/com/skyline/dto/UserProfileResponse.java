package com.skyline.dto;

import java.time.LocalDateTime;

public record UserProfileResponse(

        Long userId,
        String fullName,
        String email,
        String phone,
        String status,
        String role,
        LocalDateTime createdAt

) {
}