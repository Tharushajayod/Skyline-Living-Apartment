package com.skyline.service;

import com.skyline.dto.dashboard.MonthlyCashflowPointDto;
import com.skyline.dto.sale.SalesSummaryResponse;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Payment;
import com.skyline.entity.ReservationRefund;
import com.skyline.entity.Sale;
import com.skyline.enums.PaymentStatus;
import com.skyline.enums.RefundStatus;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.PaymentRepository;
import com.skyline.repository.ReservationRefundRepository;
import com.skyline.repository.SaleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class FinancialAnalyticsService {

    private final PaymentRepository paymentRepository;
    private final ReservationRefundRepository reservationRefundRepository;
    private final SaleRepository saleRepository;
    private final ApartmentRepository apartmentRepository;

    public FinancialAnalyticsService(PaymentRepository paymentRepository,
                                     ReservationRefundRepository reservationRefundRepository,
                                     SaleRepository saleRepository,
                                     ApartmentRepository apartmentRepository) {
        this.paymentRepository = paymentRepository;
        this.reservationRefundRepository = reservationRefundRepository;
        this.saleRepository = saleRepository;
        this.apartmentRepository = apartmentRepository;
    }

    /**
     * 1. GROSS VERIFIED CASH INFLOW
     * Only successful/verified incoming payment transactions count.
     */
    public BigDecimal getGrossVerifiedInflow() {
        BigDecimal sum = paymentRepository.sumAmountByStatus(PaymentStatus.VERIFIED);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    /**
     * 2. COMPLETED REFUNDS OUTFLOW
     * Only refunds actually paid/completed count as cash outflows.
     */
    public BigDecimal getCompletedRefundOutflow() {
        BigDecimal sum = reservationRefundRepository.sumTotalRefundByStatus(RefundStatus.COMPLETED);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    /**
     * 3. NET REALIZED CASH
     * Verified Receipts less Completed Refunds.
     * Retained fee is already the unrefunded remainder of the reservation fee;
     * DO NOT add retained fee again.
     */
    public BigDecimal getNetRealizedCash() {
        return getGrossVerifiedInflow().subtract(getCompletedRefundOutflow());
    }

    /**
     * 4. CONTRACT / SALES VALUE
     * Based on finalized apartment sales (Sale.finalPrice).
     */
    public BigDecimal getTotalContractSalesValue() {
        BigDecimal total = saleRepository.sumTotalSalesRevenue();
        if (total == null || total.compareTo(BigDecimal.ZERO) == 0) {
            total = apartmentRepository.sumPriceByStatus(ApartmentStatus.SOLD);
        }
        return total != null ? total : BigDecimal.ZERO;
    }

    public long getCompletedSalesCount() {
        long count = saleRepository.count();
        if (count == 0) {
            count = apartmentRepository.countByStatus(ApartmentStatus.SOLD);
        }
        return count;
    }

    public BigDecimal getAverageSalePrice() {
        long count = getCompletedSalesCount();
        if (count <= 0) return BigDecimal.ZERO;
        return getTotalContractSalesValue().divide(BigDecimal.valueOf(count), 0, RoundingMode.HALF_UP);
    }

    /**
     * Retained fee income breakdown for finalized/approved settlements.
     */
    public BigDecimal getRetainedFeeIncome() {
        BigDecimal sum = reservationRefundRepository.sumTotalCompanyRetained();
        return sum != null ? sum : BigDecimal.ZERO;
    }

    /**
     * Authoritative Sales & Records Summary
     */
    public SalesSummaryResponse getSalesSummary() {
        long totalSalesCount = getCompletedSalesCount();
        BigDecimal totalSalesRevenue = getTotalContractSalesValue();
        BigDecimal averageSalePrice = getAverageSalePrice();

        YearMonth thisMonth = YearMonth.now();
        LocalDate startOfMonth = thisMonth.atDay(1);
        LocalDate endOfMonth = thisMonth.atEndOfMonth();

        long thisMonthSalesCount = saleRepository.countBySaleDateBetween(startOfMonth, endOfMonth);
        BigDecimal thisMonthSalesRevenue = saleRepository.sumFinalPriceBySaleDateBetween(startOfMonth, endOfMonth);
        if (thisMonthSalesRevenue == null) thisMonthSalesRevenue = BigDecimal.ZERO;

        BigDecimal totalRetainedIncome = getRetainedFeeIncome();
        BigDecimal totalCustomerRefunds = getCompletedRefundOutflow();

        long pendingReviewCount = reservationRefundRepository.countByRefundStatus(RefundStatus.PENDING_REVIEW);
        long awaitingPaymentCount = reservationRefundRepository.countByRefundStatus(RefundStatus.PENDING_PAYMENT);
        long completedCount = reservationRefundRepository.countByRefundStatus(RefundStatus.COMPLETED);
        long totalRefundRecords = reservationRefundRepository.count();

        return SalesSummaryResponse.builder()
                .totalSalesCount(totalSalesCount)
                .totalSalesRevenue(totalSalesRevenue)
                .averageSalePrice(averageSalePrice)
                .thisMonthSalesCount(thisMonthSalesCount)
                .thisMonthSalesRevenue(thisMonthSalesRevenue)
                .totalRetainedFeeIncome(totalRetainedIncome)
                .totalCustomerRefunds(totalCustomerRefunds)
                .pendingReviewRefundsCount(pendingReviewCount)
                .awaitingPaymentRefundsCount(awaitingPaymentCount)
                .completedRefundsCount(completedCount)
                .totalRefundRecordsCount(totalRefundRecords)
                .build();
    }

    /**
     * Monthly cashflow and contract sales breakdown for last N months.
     * Cashflow: transaction-date based (payment.verifiedAt & refund.processedAt).
     * Sales: execution-date based (sale.saleDate).
     */
    public List<MonthlyCashflowPointDto> getMonthlyCashflowTrend(int months) {
        DateTimeFormatter labelFmt = DateTimeFormatter.ofPattern("MMM yyyy");
        DateTimeFormatter ymFmt = DateTimeFormatter.ofPattern("yyyy-MM");
        YearMonth current = YearMonth.now();

        List<Payment> verifiedPayments = paymentRepository.findByStatus(PaymentStatus.VERIFIED);
        List<ReservationRefund> completedRefunds = reservationRefundRepository.findByRefundStatus(RefundStatus.COMPLETED);
        List<Sale> allSales = saleRepository.findAll();

        List<MonthlyCashflowPointDto> trend = new ArrayList<>();

        for (int i = months - 1; i >= 0; i--) {
            YearMonth targetMonth = current.minusMonths(i);
            String label = targetMonth.format(labelFmt);
            String ym = targetMonth.format(ymFmt);

            // Gross incoming cash received in this month
            BigDecimal grossInflow = verifiedPayments.stream()
                    .filter(p -> p.getVerifiedAt() != null && YearMonth.from(p.getVerifiedAt()).equals(targetMonth))
                    .map(Payment::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Completed refunds disbursed in this month
            BigDecimal refundOutflow = completedRefunds.stream()
                    .filter(r -> {
                        LocalDateTime dt = r.getProcessedAt() != null ? r.getProcessedAt() : r.getCreatedAt();
                        return dt != null && YearMonth.from(dt).equals(targetMonth);
                    })
                    .map(ReservationRefund::getRefundAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal netCashflow = grossInflow.subtract(refundOutflow);

            // Finalized contract sales in this month
            BigDecimal contractSales = allSales.stream()
                    .filter(s -> s.getSaleDate() != null && YearMonth.from(s.getSaleDate()).equals(targetMonth))
                    .map(Sale::getFinalPrice)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long salesCount = allSales.stream()
                    .filter(s -> s.getSaleDate() != null && YearMonth.from(s.getSaleDate()).equals(targetMonth))
                    .count();

            trend.add(MonthlyCashflowPointDto.builder()
                    .label(label)
                    .yearMonth(ym)
                    .grossInflow(grossInflow)
                    .refundOutflow(refundOutflow)
                    .netCashflow(netCashflow)
                    .contractSales(contractSales)
                    .salesCount(salesCount)
                    .build());
        }

        return trend;
    }

    /**
     * Computes start date for a given range string: 3m, 6m, 1y, all
     */
    public LocalDate getCutoffDate(String range) {
        if (range == null || range.trim().isEmpty()) range = "6m";
        String clean = range.trim().toLowerCase();
        YearMonth current = YearMonth.now();

        switch (clean) {
            case "3m":
                return current.minusMonths(2).atDay(1);
            case "1y":
            case "12m":
                return current.minusMonths(11).atDay(1);
            case "all":
                return LocalDate.of(2000, 1, 1);
            case "6m":
            default:
                return current.minusMonths(5).atDay(1);
        }
    }

    public int getMonthCountForRange(String range) {
        if (range == null || range.trim().isEmpty()) return 6;
        String clean = range.trim().toLowerCase();
        switch (clean) {
            case "3m": return 3;
            case "1y":
            case "12m": return 12;
            case "all": return 12;
            case "6m":
            default: return 6;
        }
    }
}
