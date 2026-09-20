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
public class ReportDataResponse {
    private List<ChartPointDto> statusDistribution;
    private List<ChartPointDto> monthlySales;
    private List<ChartPointDto> monthlyRevenue;
    private List<ChartPointDto> inquiryCategories;
    private List<ChartPointDto> paymentTypes;
    private List<DistrictStatDto> districtStats;
    private BigDecimal totalRevenue;
    private BigDecimal avgSalePrice;
    private BigDecimal totalPaidAmount;
    private long totalApartmentsListed;
}
