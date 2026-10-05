package com.skyline.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyCashflowPointDto {
    private String label;
    private String yearMonth;
    private BigDecimal grossInflow;
    private BigDecimal refundOutflow;
    private BigDecimal netCashflow;
    private BigDecimal contractSales;
    private long salesCount;
}
