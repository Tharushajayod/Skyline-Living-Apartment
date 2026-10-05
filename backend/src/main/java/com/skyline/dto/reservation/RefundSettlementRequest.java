package com.skyline.dto.reservation;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
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
public class RefundSettlementRequest {

    @NotNull(message = "Company retained amount is required")
    @DecimalMin(value = "0.0", message = "Retained amount cannot be negative")
    private BigDecimal companyRetainedAmount;

    @Size(max = 1000, message = "Settlement note cannot exceed 1000 characters")
    private String settlementNote;
}
