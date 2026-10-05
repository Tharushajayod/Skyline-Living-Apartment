package com.skyline.dto.reservation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundEligibilityResponse {
    private String reservationId;
    private boolean eligible;
    private boolean cancellable;
    private BigDecimal refundAmount;
    private BigDecimal reservationFee;
    private String successfulPaymentTime;
    private String refundDeadline;
    private Long remainingSeconds;
    private String refundStatus;
    private String reason;
}
