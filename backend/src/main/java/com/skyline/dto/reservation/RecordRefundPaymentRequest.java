package com.skyline.dto.reservation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordRefundPaymentRequest {

    @NotBlank(message = "Refund method is required (e.g. Bank Transfer, Cash, Other)")
    private String refundMethod;

    private String transactionReference;

    private String refundDate;

    @Size(max = 1000, message = "Internal note cannot exceed 1000 characters")
    private String internalNote;

    private String proofUrl;
}
