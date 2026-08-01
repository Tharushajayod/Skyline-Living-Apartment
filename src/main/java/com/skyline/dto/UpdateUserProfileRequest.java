package com.skyline.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateUserProfileRequest(

        @NotBlank(message = "Full name is required")
        @Size(
                min = 3,
                max = 150,
                message = "Full name must be between 3 and 150 characters"
        )
        String fullName,

        @Pattern(
                regexp = "^$|^[0-9+\\- ]{7,20}$",
                message = "Invalid phone number"
        )
        String phone,

        @Size(
                max = 50,
                message = "NIC or passport number cannot exceed 50 characters"
        )
        String nicPassportNumber,

        @Size(
                max = 255,
                message = "Address line 1 cannot exceed 255 characters"
        )
        String addressLine1,

        @Size(
                max = 255,
                message = "Address line 2 cannot exceed 255 characters"
        )
        String addressLine2,

        @Size(
                max = 100,
                message = "City cannot exceed 100 characters"
        )
        String city,

        @Size(
                max = 100,
                message = "Country cannot exceed 100 characters"
        )
        String country,

        @Pattern(
                regexp = "^$|^(EMAIL|PHONE|SMS|WHATSAPP)$",
                message = "Preferred contact method must be EMAIL, PHONE, SMS or WHATSAPP"
        )
        String preferredContactMethod

) {
}