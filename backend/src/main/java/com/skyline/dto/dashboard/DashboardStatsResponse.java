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
    private BigDecimal totalRevenue;
    private BigDecimal realizedRevenue;
    private BigDecimal monthRevenue;
    private List<ChartPointDto> monthlySalesTrend;
}
