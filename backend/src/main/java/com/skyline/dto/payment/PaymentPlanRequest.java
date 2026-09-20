package com.skyline.dto.payment;

import com.skyline.enums.PaymentPlanType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentPlanRequest {

    @NotBlank(message = "Reservation ID is required")
    private String reservationId;

    @NotNull(message = "Plan type is required")
    private PaymentPlanType planType;

    @NotNull(message = "Number of payments is required")
    @Positive(message = "Number of payments must be greater than zero")
    private Integer numberOfPayments;

    @NotNull(message = "Payment amount is required")
    @Positive(message = "Payment amount must be greater than zero")
    private BigDecimal paymentAmount;

    private LocalDate startDate;

    private String notes;
}