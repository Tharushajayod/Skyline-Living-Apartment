package com.skyline.dto.payment;

import java.time.LocalDateTime;

public record PaymentEvidenceResponse(

        Long paymentEvidenceId,
        Long paymentId,
        String fileName,
        String fileUrl,
        String mimeType,
        Long uploadedByUserId,
        String uploadedByName,
        LocalDateTime uploadedAt

) {
}