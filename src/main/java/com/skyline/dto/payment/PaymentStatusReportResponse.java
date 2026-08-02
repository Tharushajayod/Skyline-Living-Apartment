package com.skyline.dto.payment;

public record PaymentStatusReportResponse(

        long paid,
        long pending,
        long rejected,
        long partiallyPaid

) {
}