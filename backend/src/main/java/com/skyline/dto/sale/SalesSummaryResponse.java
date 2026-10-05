package com.skyline.dto.sale;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesSummaryResponse {
    private long totalSalesCount;
    private BigDecimal totalSalesRevenue;
    private BigDecimal averageSalePrice;
    private long thisMonthSalesCount;
    private BigDecimal thisMonthSalesRevenue;
    private BigDecimal totalRetainedFeeIncome;
    private BigDecimal totalCustomerRefunds;
    private long pendingReviewRefundsCount;
    private long awaitingPaymentRefundsCount;
    private long completedRefundsCount;
    private long totalRefundRecordsCount;
}
