package com.skyline.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentPlanDecisionRequest {

    private String notes;

    private BigDecimal annualInterestRate;

    private BigDecimal additionalAmount;
}