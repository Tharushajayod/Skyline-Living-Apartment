package com.skyline.dto;

import java.time.LocalDateTime;
import java.util.Set;

public record UserProfileResponse(

        Long userId,
        Long customerId,

        String fullName,
        String email,
        String phone,
        String profileImageUrl,

        String nicPassportNumber,
        String addressLine1,
        String addressLine2,
        String city,
        String country,
        String preferredContactMethod,
        String leadSource,

        String accountStatus,
        boolean emailVerified,
        Set<String> roles,

        LocalDateTime lastLoginAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt

) {
}