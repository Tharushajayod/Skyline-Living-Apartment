package com.skyline.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalApartments;
    private long availableApartments;
    private long activeReservations;
    private long soldApartments;
    private long pendingAppointments;
    private long pendingPayments;
    private BigDecimal pendingAmount;
    private long unresolvedInquiries;
    private long totalCustomers;
    private long totalUsers;
    private long totalSalesCount;
    private BigDecimal totalSalesValue;
    private BigDecimal totalRevenue; // Alias for totalSalesValue
    private BigDecimal grossVerifiedInflow;
    private BigDecimal completedRefundOutflow;
    private BigDecimal netRealizedCash;
    private BigDecimal realizedRevenue; // Alias for netRealizedCash
    private BigDecimal retainedFeeIncome;
    private BigDecimal monthGrossInflow;
    private BigDecimal monthRefundOutflow;
    private BigDecimal monthNetCashflow;
    private BigDecimal monthRevenue; // Alias for monthNetCashflow
    private List<ChartPointDto> monthlySalesTrend;
    private List<MonthlyCashflowPointDto> monthlyCashflow;
}
