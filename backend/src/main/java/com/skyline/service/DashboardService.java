package com.skyline.service;

import com.skyline.dto.dashboard.ChartPointDto;
import com.skyline.dto.dashboard.DashboardStatsResponse;
import com.skyline.dto.dashboard.DistrictStatDto;
import com.skyline.dto.dashboard.MonthlyCashflowPointDto;
import com.skyline.dto.dashboard.ReportDataResponse;
import com.skyline.entity.*;
import com.skyline.enums.*;
import com.skyline.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final ApartmentRepository apartmentRepository;
    private final AppointmentRepository appointmentRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final InquiryRepository inquiryRepository;
    private final UserRepository userRepository;
    private final FinancialAnalyticsService financialAnalyticsService;

    public DashboardService(ApartmentRepository apartmentRepository,
                            AppointmentRepository appointmentRepository,
                            ReservationRepository reservationRepository,
                            PaymentRepository paymentRepository,
                            InquiryRepository inquiryRepository,
                            UserRepository userRepository,
                            FinancialAnalyticsService financialAnalyticsService) {
        this.apartmentRepository = apartmentRepository;
        this.appointmentRepository = appointmentRepository;
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
        this.inquiryRepository = inquiryRepository;
        this.userRepository = userRepository;
        this.financialAnalyticsService = financialAnalyticsService;
    }

    public DashboardStatsResponse getStats() {
        long totalApts = apartmentRepository.count();
        long availableApts = apartmentRepository.countByStatus(ApartmentStatus.AVAILABLE);
        long soldApts = apartmentRepository.countByStatus(ApartmentStatus.SOLD);

        long activeReservations = reservationRepository.countByStatusIn(List.of(ReservationStatus.CONFIRMED, ReservationStatus.PENDING));

        long pendingAppts = appointmentRepository.countByStatus(AppointmentStatus.PENDING);
        long pendingPayments = paymentRepository.countByStatus(PaymentStatus.PENDING);
        BigDecimal pendingAmount = paymentRepository.sumAmountByStatus(PaymentStatus.PENDING);
        if (pendingAmount == null) pendingAmount = BigDecimal.ZERO;

        long unresolvedInq = inquiryRepository.countByStatusNot(InquiryStatus.RESOLVED);
        long totalCustomers = userRepository.countByRole(UserRole.CUSTOMER);
        long totalUsers = userRepository.count();

        // Authoritative Financial Figures from FinancialAnalyticsService
        long salesCount = financialAnalyticsService.getCompletedSalesCount();
        BigDecimal totalSalesValue = financialAnalyticsService.getTotalContractSalesValue();
        BigDecimal grossInflow = financialAnalyticsService.getGrossVerifiedInflow();
        BigDecimal refundOutflow = financialAnalyticsService.getCompletedRefundOutflow();
        BigDecimal netRealizedCash = financialAnalyticsService.getNetRealizedCash();
        BigDecimal retainedFeeIncome = financialAnalyticsService.getRetainedFeeIncome();

        // Monthly cashflow trend for last 6 months
        List<MonthlyCashflowPointDto> monthlyCashflow = financialAnalyticsService.getMonthlyCashflowTrend(6);

        // Current month figures
        YearMonth thisMonth = YearMonth.now();
        MonthlyCashflowPointDto thisMonthPoint = monthlyCashflow.stream()
                .filter(p -> p.getYearMonth() != null && p.getYearMonth().equals(thisMonth.toString()))
                .findFirst()
                .orElse(null);

        BigDecimal monthGrossInflow = thisMonthPoint != null ? thisMonthPoint.getGrossInflow() : BigDecimal.ZERO;
        BigDecimal monthRefundOutflow = thisMonthPoint != null ? thisMonthPoint.getRefundOutflow() : BigDecimal.ZERO;
        BigDecimal monthNetCashflow = thisMonthPoint != null ? thisMonthPoint.getNetCashflow() : BigDecimal.ZERO;

        // Legacy chart compatibility: maps net cashflow to long value
        List<ChartPointDto> monthlySalesTrend = monthlyCashflow.stream()
                .map(p -> new ChartPointDto(p.getLabel(), p.getNetCashflow().longValue()))
                .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
                .totalApartments(totalApts)
                .availableApartments(availableApts)
                .activeReservations(activeReservations)
                .soldApartments(soldApts)
                .pendingAppointments(pendingAppts)
                .pendingPayments(pendingPayments)
                .pendingAmount(pendingAmount)
                .unresolvedInquiries(unresolvedInq)
                .totalCustomers(totalCustomers)
                .totalUsers(totalUsers)
                .totalSalesCount(salesCount > 0 ? salesCount : soldApts)
                .totalSalesValue(totalSalesValue)
                .totalRevenue(totalSalesValue)
                .grossVerifiedInflow(grossInflow)
                .completedRefundOutflow(refundOutflow)
                .netRealizedCash(netRealizedCash)
                .realizedRevenue(netRealizedCash)
                .retainedFeeIncome(retainedFeeIncome)
                .monthGrossInflow(monthGrossInflow)
                .monthRefundOutflow(monthRefundOutflow)
                .monthNetCashflow(monthNetCashflow)
                .monthRevenue(monthNetCashflow)
                .monthlySalesTrend(monthlySalesTrend)
                .monthlyCashflow(monthlyCashflow)
                .build();
    }

    public ReportDataResponse getReports() {
        return getReports("6m");
    }

    public ReportDataResponse getReports(String range) {
        int monthCount = financialAnalyticsService.getMonthCountForRange(range);
        List<MonthlyCashflowPointDto> monthlyCashflow = financialAnalyticsService.getMonthlyCashflowTrend(monthCount);

        // 1. Status distribution
        long activeReserved = reservationRepository.countByStatusIn(List.of(ReservationStatus.CONFIRMED, ReservationStatus.PENDING));

        List<ChartPointDto> statusDist = Arrays.asList(
                new ChartPointDto("Available", apartmentRepository.countByStatus(ApartmentStatus.AVAILABLE)),
                new ChartPointDto("Reserved", activeReserved),
                new ChartPointDto("Sold", apartmentRepository.countByStatus(ApartmentStatus.SOLD))
        );

        // 2. Inquiry category distribution
        Map<InquiryCategory, Long> inqMap = inquiryRepository.findAll().stream()
                .collect(Collectors.groupingBy(i -> i.getCategory() != null ? i.getCategory() : InquiryCategory.GENERAL, Collectors.counting()));
        List<ChartPointDto> inquiryCategories = Arrays.stream(InquiryCategory.values())
                .map(cat -> new ChartPointDto(cat.getDisplayValue(), inqMap.getOrDefault(cat, 0L)))
                .collect(Collectors.toList());

        // 3. Payment types distribution
        Map<PaymentType, Long> payMap = paymentRepository.findAll().stream()
                .collect(Collectors.groupingBy(Payment::getType, Collectors.counting()));
        List<ChartPointDto> paymentTypes = Arrays.stream(PaymentType.values())
                .map(pt -> new ChartPointDto(pt.getDisplayValue(), payMap.getOrDefault(pt, 0L)))
                .collect(Collectors.toList());

        // 4. Aggregates across the selected window
        BigDecimal grossInflow = monthlyCashflow.stream()
                .map(MonthlyCashflowPointDto::getGrossInflow)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal refundOutflow = monthlyCashflow.stream()
                .map(MonthlyCashflowPointDto::getRefundOutflow)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netRealizedCash = grossInflow.subtract(refundOutflow);

        BigDecimal totalContractSales = monthlyCashflow.stream()
                .map(MonthlyCashflowPointDto::getContractSales)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long apartmentsSold = monthlyCashflow.stream()
                .mapToLong(MonthlyCashflowPointDto::getSalesCount)
                .sum();

        // If all-time or window includes all sales, ensure minimum aligns with actual DB
        if ("all".equalsIgnoreCase(range) || totalContractSales.compareTo(BigDecimal.ZERO) == 0) {
            BigDecimal allSalesTotal = financialAnalyticsService.getTotalContractSalesValue();
            long allSalesCount = financialAnalyticsService.getCompletedSalesCount();
            if (totalContractSales.compareTo(BigDecimal.ZERO) == 0 && allSalesTotal.compareTo(BigDecimal.ZERO) > 0) {
                totalContractSales = allSalesTotal;
                apartmentsSold = allSalesCount;
            }
        }

        BigDecimal avgPrice = BigDecimal.ZERO;
        if (apartmentsSold > 0 && totalContractSales.compareTo(BigDecimal.ZERO) > 0) {
            avgPrice = totalContractSales.divide(BigDecimal.valueOf(apartmentsSold), 0, RoundingMode.HALF_UP);
        } else if (financialAnalyticsService.getCompletedSalesCount() > 0) {
            avgPrice = financialAnalyticsService.getAverageSalePrice();
        }

        BigDecimal retainedFeeIncome = financialAnalyticsService.getRetainedFeeIncome();

        // Monthly sales volume chart (deeds count)
        List<ChartPointDto> monthlySales = monthlyCashflow.stream()
                .map(p -> new ChartPointDto(p.getLabel(), p.getSalesCount()))
                .collect(Collectors.toList());

        // Monthly net cashflow chart (inflow - outflow)
        List<ChartPointDto> monthlyRevenue = monthlyCashflow.stream()
                .map(p -> new ChartPointDto(p.getLabel(), p.getNetCashflow().longValue()))
                .collect(Collectors.toList());

        // 5. District stats from live apartments
        List<DistrictStatDto> districtStats = apartmentRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        a -> a.getDistrict() != null && !a.getDistrict().trim().isEmpty()
                                ? a.getDistrict().trim()
                                : (a.getCity() != null && !a.getCity().trim().isEmpty() ? a.getCity().trim() : "Colombo Central"),
                        Collectors.toList()
                ))
                .entrySet().stream()
                .map(entry -> {
                    String district = entry.getKey();
                    List<Apartment> list = entry.getValue();
                    long count = list.size();
                    BigDecimal totalVal = list.stream().map(Apartment::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new DistrictStatDto(district, count, totalVal);
                })
                .sorted((a, b) -> b.getRevenue().compareTo(a.getRevenue()))
                .collect(Collectors.toList());

        long totalApartmentsListed = apartmentRepository.count();

        return ReportDataResponse.builder()
                .statusDistribution(statusDist)
                .monthlySales(monthlySales)
                .monthlyRevenue(monthlyRevenue)
                .monthlyCashflow(monthlyCashflow)
                .inquiryCategories(inquiryCategories)
                .paymentTypes(paymentTypes)
                .districtStats(districtStats)
                .grossVerifiedInflow(grossInflow)
                .completedRefundOutflow(refundOutflow)
                .netRealizedCash(netRealizedCash)
                .totalContractSales(totalContractSales)
                .totalRevenue(totalContractSales)
                .apartmentsSold(apartmentsSold)
                .avgSalePrice(avgPrice)
                .retainedFeeIncome(retainedFeeIncome)
                .totalPaidAmount(grossInflow)
                .totalApartmentsListed(totalApartmentsListed)
                .build();
    }
}
