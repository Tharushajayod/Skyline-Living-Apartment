package com.skyline.dto.payment;

import java.math.BigDecimal;

public class MonthlyRevenueResponse {

    private int month;
    private String monthName;
    private BigDecimal totalRevenue;

    public MonthlyRevenueResponse() {
    }

    public MonthlyRevenueResponse(
            int month,
            String monthName,
            BigDecimal totalRevenue
    ) {
        this.month = month;
        this.monthName = monthName;
        this.totalRevenue = totalRevenue;
    }

    public int getMonth() {
        return month;
    }

    public void setMonth(int month) {
        this.month = month;
    }

    public String getMonthName() {
        return monthName;
    }

    public void setMonthName(String monthName) {
        this.monthName = monthName;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }
}