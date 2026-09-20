package com.skyline.dto.sale;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleRequest {

    private String apartmentId;

    private String reservationId;

    private String customerName;

    private String customerEmail;

    @NotNull(message = "Final price is required")
    @Positive(message = "Final price must be positive")
    private BigDecimal finalPrice;

    private String saleDate;
}
