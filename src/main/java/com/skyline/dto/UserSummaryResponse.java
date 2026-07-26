package com.skyline.dto;

import java.time.LocalDateTime;

public record UserSummaryResponse(

        Long userId,
        String fullName,
        String email,
        String phone,
        String role,
        String status,
        LocalDateTime createdAt

) {
}