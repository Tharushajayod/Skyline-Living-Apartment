package com.skyline.dto.payment;

import java.math.BigDecimal;

public record PaymentDashboardSummaryResponse(

        long totalPayments,
        long pendingPayments,
        long paidPayments,
        long rejectedPayments,
        long partiallyPaidPayments,
        BigDecimal totalRevenue,
        BigDecimal totalOutstandingAmount

) {
}