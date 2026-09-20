package com.skyline.dto.payment;

import com.skyline.enums.PaymentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {

    private String reservationId;

    private String apartmentId;

    private String paymentPlanId;

    private String paymentPlanItemId;

    @NotNull(message = "Payment type is required")
    private PaymentType type;

    @NotNull(message = "Payment amount is required")
    @Positive(message = "Payment amount must be greater than zero")
    private BigDecimal amount;

    private String notes;
}