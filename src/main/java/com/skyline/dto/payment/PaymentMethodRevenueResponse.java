package com.skyline.dto.payment;

import java.math.BigDecimal;

public record PaymentMethodRevenueResponse(

        String paymentMethod,
        long paymentCount,
        BigDecimal totalAmount

) {
}