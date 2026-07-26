package com.skyline.dto;

import java.time.LocalDateTime;

public record ApiResponse(

        boolean success,
        String message,
        LocalDateTime timestamp

) {
}