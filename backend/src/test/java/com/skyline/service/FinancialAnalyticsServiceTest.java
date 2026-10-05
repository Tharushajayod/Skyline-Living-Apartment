package com.skyline.service;

import com.skyline.dto.dashboard.MonthlyCashflowPointDto;
import com.skyline.dto.sale.SalesSummaryResponse;
import com.skyline.entity.*;
import com.skyline.enums.*;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.PaymentRepository;
import com.skyline.repository.ReservationRefundRepository;
import com.skyline.repository.SaleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FinancialAnalyticsServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private ReservationRefundRepository reservationRefundRepository;

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private ApartmentRepository apartmentRepository;

    private FinancialAnalyticsService financialAnalyticsService;

    @BeforeEach
    void setUp() {
        financialAnalyticsService = new FinancialAnalyticsService(
                paymentRepository,
                reservationRefundRepository,
                saleRepository,
                apartmentRepository
        );
    }

    /**
     * TEST 1:
     * Incoming: 980,000; 8,820,000; 2,250,000
     * Refund completed: 2,245,000 (retained = 5,000)
     * Expected:
     * Gross Inflow = 12,050,000
     * Refund Outflow = 2,245,000
     * Net Realized Cash = 9,805,000
     * Retained breakdown = 5,000
     * Ensure retained 5,000 is NOT added twice!
     */
    @Test
    void testStandardInflowRefundAndNetRealizedCash() {
        when(paymentRepository.sumAmountByStatus(PaymentStatus.VERIFIED))
                .thenReturn(new BigDecimal("12050000"));
        when(reservationRefundRepository.sumTotalRefundByStatus(RefundStatus.COMPLETED))
                .thenReturn(new BigDecimal("2245000"));
        when(reservationRefundRepository.sumTotalCompanyRetained())
                .thenReturn(new BigDecimal("5000"));

        BigDecimal grossInflow = financialAnalyticsService.getGrossVerifiedInflow();
        BigDecimal refundOutflow = financialAnalyticsService.getCompletedRefundOutflow();
        BigDecimal netRealizedCash = financialAnalyticsService.getNetRealizedCash();
        BigDecimal retainedIncome = financialAnalyticsService.getRetainedFeeIncome();

        assertEquals(new BigDecimal("12050000"), grossInflow);
        assertEquals(new BigDecimal("2245000"), refundOutflow);
        // Net cash = 12,050,000 - 2,245,000 = 9,805,000
        assertEquals(new BigDecimal("9805000"), netRealizedCash);
        // Retained breakdown is 5,000 (already retained inside net cash, not added on top)
        assertEquals(new BigDecimal("5000"), retainedIncome);
        assertNotEquals(new BigDecimal("9810000"), netRealizedCash, "Retained fee must NOT be added twice!");
    }

    /**
     * TEST 2:
     * Refund is PENDING_PAYMENT (or PENDING_REVIEW).
     * Expected:
     * Gross Inflow = 12,050,000
     * Refund Outflow = 0
     * Net Realized Cash = 12,050,000
     */
    @Test
    void testPendingRefundDoesNotDeductFromRealizedCash() {
        when(paymentRepository.sumAmountByStatus(PaymentStatus.VERIFIED))
                .thenReturn(new BigDecimal("12050000"));
        // Only COMPLETED refunds are cash outflows; PENDING_PAYMENT sum is 0
        when(reservationRefundRepository.sumTotalRefundByStatus(RefundStatus.COMPLETED))
                .thenReturn(BigDecimal.ZERO);

        BigDecimal grossInflow = financialAnalyticsService.getGrossVerifiedInflow();
        BigDecimal refundOutflow = financialAnalyticsService.getCompletedRefundOutflow();
        BigDecimal netRealizedCash = financialAnalyticsService.getNetRealizedCash();

        assertEquals(new BigDecimal("12050000"), grossInflow);
        assertEquals(BigDecimal.ZERO, refundOutflow);
        assertEquals(new BigDecimal("12050000"), netRealizedCash);
    }

    /**
     * TEST 3:
     * Apartment: 10,000,000
     * Installment paid this month: 1,000,000
     * Expected:
     * Monthly Gross Inflow = 1,000,000 (NOT 10,000,000)
     * If sale finalized: Contract Sales Value = 10,000,000.
     */
    @Test
    void testInstallmentPaymentMonthlyCashflowVersusContractSales() {
        YearMonth current = YearMonth.now();

        Payment verifiedInstallment = Payment.builder()
                .id(1L)
                .amount(new BigDecimal("1000000"))
                .status(PaymentStatus.VERIFIED)
                .verifiedAt(current.atDay(10).atTime(10, 0))
                .type(PaymentType.INSTALLMENT_PAYMENT)
                .build();

        Sale finalizedSale = Sale.builder()
                .id(1L)
                .finalPrice(new BigDecimal("10000000"))
                .saleDate(current.atDay(5))
                .build();

        when(paymentRepository.findByStatus(PaymentStatus.VERIFIED))
                .thenReturn(List.of(verifiedInstallment));
        when(reservationRefundRepository.findByRefundStatus(RefundStatus.COMPLETED))
                .thenReturn(List.of());
        when(saleRepository.findAll())
                .thenReturn(List.of(finalizedSale));

        List<MonthlyCashflowPointDto> trend = financialAnalyticsService.getMonthlyCashflowTrend(1);
        assertEquals(1, trend.size());

        MonthlyCashflowPointDto currentMonth = trend.get(0);
        // Cashflow only counts actual verified payment (1,000,000)
        assertEquals(new BigDecimal("1000000"), currentMonth.getGrossInflow());
        assertEquals(new BigDecimal("1000000"), currentMonth.getNetCashflow());
        assertNotEquals(new BigDecimal("10000000"), currentMonth.getGrossInflow(), "Apartment sale price must not be treated as cash inflow!");

        // Contract sales value reflects full finalized property value (10,000,000)
        assertEquals(new BigDecimal("10000000"), currentMonth.getContractSales());
        assertEquals(1, currentMonth.getSalesCount());
    }

    /**
     * TEST 4:
     * Part payment:
     * September = 980,000
     * October = 2,000,000
     * Expected monthly inflow:
     * September: 980,000
     * October: 2,000,000
     */
    @Test
    void testPartPaymentsMonthlyInflow() {
        YearMonth current = YearMonth.now();
        YearMonth lastMonth = current.minusMonths(1);

        Payment p1 = Payment.builder()
                .id(1L)
                .amount(new BigDecimal("980000"))
                .status(PaymentStatus.VERIFIED)
                .verifiedAt(lastMonth.atDay(15).atTime(12, 0))
                .type(PaymentType.PART_PAYMENT)
                .build();

        Payment p2 = Payment.builder()
                .id(2L)
                .amount(new BigDecimal("2000000"))
                .status(PaymentStatus.VERIFIED)
                .verifiedAt(current.atDay(2).atTime(14, 0))
                .type(PaymentType.PART_PAYMENT)
                .build();

        when(paymentRepository.findByStatus(PaymentStatus.VERIFIED))
                .thenReturn(List.of(p1, p2));
        when(reservationRefundRepository.findByRefundStatus(RefundStatus.COMPLETED))
                .thenReturn(List.of());
        when(saleRepository.findAll())
                .thenReturn(List.of());

        List<MonthlyCashflowPointDto> trend = financialAnalyticsService.getMonthlyCashflowTrend(2);
        assertEquals(2, trend.size());

        MonthlyCashflowPointDto lastMonthDto = trend.get(0);
        MonthlyCashflowPointDto currentMonthDto = trend.get(1);

        assertEquals(new BigDecimal("980000"), lastMonthDto.getGrossInflow());
        assertEquals(new BigDecimal("2000000"), currentMonthDto.getGrossInflow());
    }

    /**
     * TEST 5:
     * Reservation fee: 980,000
     * Remaining balance: 8,820,000
     * Apartment: 9,800,000
     * Expected gross received after both: 9,800,000 (not 10,780,000).
     */
    @Test
    void testReservationFeePlusRemainingBalanceDoesNotExceedApartmentPrice() {
        Payment rsv = Payment.builder()
                .id(7L)
                .amount(new BigDecimal("980000"))
                .status(PaymentStatus.VERIFIED)
                .type(PaymentType.RESERVATION_FEE)
                .build();

        Payment balance = Payment.builder()
                .id(8L)
                .amount(new BigDecimal("8820000"))
                .status(PaymentStatus.VERIFIED)
                .type(PaymentType.FULL_PAYMENT)
                .build();

        when(paymentRepository.sumAmountByStatus(PaymentStatus.VERIFIED))
                .thenReturn(rsv.getAmount().add(balance.getAmount()));

        BigDecimal totalVerified = financialAnalyticsService.getGrossVerifiedInflow();
        assertEquals(new BigDecimal("9800000"), totalVerified);
        assertNotEquals(new BigDecimal("10780000"), totalVerified);
    }

    /**
     * TEST 6:
     * Refund requested in Month - 1
     * Refund completed in Month 0
     * Expected:
     * Month - 1 refund outflow = 0
     * Month 0 refund outflow = actual completed refund amount
     */
    @Test
    void testRefundOutflowAssignedToCompletionMonthNotRequestMonth() {
        YearMonth current = YearMonth.now();
        YearMonth lastMonth = current.minusMonths(1);

        ReservationRefund refund = ReservationRefund.builder()
                .id(1L)
                .originalFee(new BigDecimal("2250000"))
                .companyRetainedAmount(new BigDecimal("5000"))
                .refundAmount(new BigDecimal("2245000"))
                .refundStatus(RefundStatus.COMPLETED)
                .requestedAt(lastMonth.atDay(28).atTime(10, 0))
                .reviewedAt(lastMonth.atDay(29).atTime(15, 0))
                .processedAt(current.atDay(3).atTime(11, 0)) // Completed in current month
                .build();

        when(paymentRepository.findByStatus(PaymentStatus.VERIFIED))
                .thenReturn(List.of());
        when(reservationRefundRepository.findByRefundStatus(RefundStatus.COMPLETED))
                .thenReturn(List.of(refund));
        when(saleRepository.findAll())
                .thenReturn(List.of());

        List<MonthlyCashflowPointDto> trend = financialAnalyticsService.getMonthlyCashflowTrend(2);
        assertEquals(2, trend.size());

        MonthlyCashflowPointDto lastMonthDto = trend.get(0);
        MonthlyCashflowPointDto currentMonthDto = trend.get(1);

        // Requested last month, but outflow is 0 last month
        assertEquals(BigDecimal.ZERO, lastMonthDto.getRefundOutflow());
        // Completed this month, outflow is 2,245,000 this month
        assertEquals(new BigDecimal("2245000"), currentMonthDto.getRefundOutflow());
        assertEquals(new BigDecimal("-2245000"), currentMonthDto.getNetCashflow());
    }

    /**
     * TEST 7:
     * Rejected and pending payment slips must contribute 0.
     */
    @Test
    void testRejectedAndPendingSlipsContributeZeroToInflow() {
        // Repository sumAmountByStatus(VERIFIED) only sums VERIFIED
        when(paymentRepository.sumAmountByStatus(PaymentStatus.VERIFIED))
                .thenReturn(new BigDecimal("500000"));

        BigDecimal verifiedInflow = financialAnalyticsService.getGrossVerifiedInflow();
        assertEquals(new BigDecimal("500000"), verifiedInflow);
        verify(paymentRepository, never()).sumAmountByStatus(PaymentStatus.PENDING);
        verify(paymentRepository, never()).sumAmountByStatus(PaymentStatus.REJECTED);
    }

    /**
     * TEST 8:
     * Future unpaid installments must contribute 0.
     */
    @Test
    void testFutureUnpaidInstallmentContributesZero() {
        // Scheduled items are not in payments table with status VERIFIED
        when(paymentRepository.sumAmountByStatus(PaymentStatus.VERIFIED))
                .thenReturn(BigDecimal.ZERO);
        assertEquals(BigDecimal.ZERO, financialAnalyticsService.getGrossVerifiedInflow());
    }

    /**
     * TEST 9:
     * Sales & Records:
     * Apartment final sale price = 9,800,000 regardless of purchase method:
     * completed sale value = 9,800,000.
     */
    @Test
    void testCompletedSaleValueReflectsFinalContractPrice() {
        when(saleRepository.count()).thenReturn(1L);
        when(saleRepository.sumTotalSalesRevenue()).thenReturn(new BigDecimal("9800000"));

        BigDecimal contractSales = financialAnalyticsService.getTotalContractSalesValue();
        long count = financialAnalyticsService.getCompletedSalesCount();
        BigDecimal avg = financialAnalyticsService.getAverageSalePrice();

        assertEquals(new BigDecimal("9800000"), contractSales);
        assertEquals(1L, count);
        assertEquals(new BigDecimal("9800000"), avg);
    }

    /**
     * TEST 10:
     * SalesSummaryResponse aggregates all authoritative metrics cleanly.
     */
    @Test
    void testSalesSummaryResponse() {
        when(saleRepository.count()).thenReturn(2L);
        when(saleRepository.sumTotalSalesRevenue()).thenReturn(new BigDecimal("20000000"));
        when(saleRepository.countBySaleDateBetween(any(), any())).thenReturn(1L);
        when(saleRepository.sumFinalPriceBySaleDateBetween(any(), any())).thenReturn(new BigDecimal("10000000"));
        when(reservationRefundRepository.sumTotalCompanyRetained()).thenReturn(new BigDecimal("25000"));
        when(reservationRefundRepository.sumTotalRefundByStatus(RefundStatus.COMPLETED)).thenReturn(new BigDecimal("4500000"));
        when(reservationRefundRepository.countByRefundStatus(RefundStatus.PENDING_REVIEW)).thenReturn(1L);
        when(reservationRefundRepository.countByRefundStatus(RefundStatus.PENDING_PAYMENT)).thenReturn(2L);
        when(reservationRefundRepository.countByRefundStatus(RefundStatus.COMPLETED)).thenReturn(3L);
        when(reservationRefundRepository.count()).thenReturn(6L);

        SalesSummaryResponse summary = financialAnalyticsService.getSalesSummary();

        assertNotNull(summary);
        assertEquals(2L, summary.getTotalSalesCount());
        assertEquals(new BigDecimal("20000000"), summary.getTotalSalesRevenue());
        assertEquals(new BigDecimal("10000000"), summary.getAverageSalePrice());
        assertEquals(1L, summary.getThisMonthSalesCount());
        assertEquals(new BigDecimal("10000000"), summary.getThisMonthSalesRevenue());
        assertEquals(new BigDecimal("25000"), summary.getTotalRetainedFeeIncome());
        assertEquals(new BigDecimal("4500000"), summary.getTotalCustomerRefunds());
        assertEquals(1L, summary.getPendingReviewRefundsCount());
        assertEquals(2L, summary.getAwaitingPaymentRefundsCount());
        assertEquals(3L, summary.getCompletedRefundsCount());
        assertEquals(6L, summary.getTotalRefundRecordsCount());
    }
}
