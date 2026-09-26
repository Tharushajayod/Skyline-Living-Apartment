package com.skyline.dto.reservation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationCancellationRequest {

    @NotNull(message = "Refund amount is required")
    @PositiveOrZero(message = "Refund amount must be zero or positive")
    private BigDecimal refundAmount;

    @NotNull(message = "Company retained amount is required")
    @PositiveOrZero(message = "Company retained amount must be zero or positive")
    private BigDecimal companyRetainedAmount;

    @NotBlank(message = "Cancellation reason is required")
    @Size(max = 1000, message = "Reason cannot exceed 1000 characters")
    private String reason;

    private String notes;
}
