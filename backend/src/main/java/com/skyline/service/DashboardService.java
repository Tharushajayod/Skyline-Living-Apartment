package com.skyline.service;

import com.skyline.dto.dashboard.ChartPointDto;
import com.skyline.dto.dashboard.DashboardStatsResponse;
import com.skyline.dto.dashboard.DistrictStatDto;
import com.skyline.dto.dashboard.ReportDataResponse;
import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Payment;
import com.skyline.entity.Sale;
import com.skyline.enums.*;
import com.skyline.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ApartmentRepository apartmentRepository;
    private final AppointmentRepository appointmentRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final InquiryRepository inquiryRepository;
    private final UserRepository userRepository;
    private final SaleRepository saleRepository;

    public DashboardService(ApartmentRepository apartmentRepository,
                            AppointmentRepository appointmentRepository,
                            ReservationRepository reservationRepository,
                            PaymentRepository paymentRepository,
                            InquiryRepository inquiryRepository,
                            UserRepository userRepository,
                            SaleRepository saleRepository) {
        this.apartmentRepository = apartmentRepository;
        this.appointmentRepository = appointmentRepository;
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
        this.inquiryRepository = inquiryRepository;
        this.userRepository = userRepository;
        this.saleRepository = saleRepository;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        long totalApts = apartmentRepository.count();
        long availableApts = apartmentRepository.countByStatus(ApartmentStatus.AVAILABLE);
        long soldApts = apartmentRepository.countByStatus(ApartmentStatus.SOLD);

        // Calculate active reservations with single DB count query (Pending or Confirmed)
        long activeReservations = reservationRepository.countByStatusIn(List.of(ReservationStatus.CONFIRMED, ReservationStatus.PENDING));

        long pendingAppts = appointmentRepository.countByStatus(AppointmentStatus.PENDING);
        long pendingPayments = paymentRepository.countByStatus(PaymentStatus.PENDING);
        BigDecimal pendingAmount = paymentRepository.sumAmountByStatus(PaymentStatus.PENDING);

        long unresolvedInq = inquiryRepository.countByStatusNot(InquiryStatus.RESOLVED);
        long totalCustomers = userRepository.countByRole(UserRole.CUSTOMER);
        long totalUsers = userRepository.count();

        long salesCount = saleRepository.count();
        BigDecimal totalRevenue = saleRepository.sumTotalSalesRevenue();
        if (totalRevenue == null || totalRevenue.compareTo(BigDecimal.ZERO) == 0) {
            totalRevenue = apartmentRepository.sumPriceByStatus(ApartmentStatus.SOLD);
        }

        BigDecimal realizedRevenue = paymentRepository.sumAmountByStatus(PaymentStatus.VERIFIED);
        if (realizedRevenue == null) realizedRevenue = BigDecimal.ZERO;

        List<Payment> verifiedPayments = paymentRepository.findByStatus(PaymentStatus.VERIFIED);

        // Calculate this month's revenue (from verified payments)
        YearMonth thisMonth = YearMonth.now();
        BigDecimal monthRevenue = verifiedPayments.stream()
                .filter(p -> p.getVerifiedAt() != null && YearMonth.from(p.getVerifiedAt()).equals(thisMonth))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Monthly sales trend (last 6 months)
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM");
        List<ChartPointDto> monthlySalesTrend = new ArrayList<>();
        YearMonth current = YearMonth.now();

        for (int i = 5; i >= 0; i--) {
            YearMonth targetMonth = current.minusMonths(i);
            String label = targetMonth.format(monthFmt);
            long amount = verifiedPayments.stream()
                    .filter(p -> p.getVerifiedAt() != null && YearMonth.from(p.getVerifiedAt()).equals(targetMonth))
                    .map(p -> p.getAmount().longValue())
                    .reduce(0L, Long::sum);
            monthlySalesTrend.add(new ChartPointDto(label, amount));
        }

        return DashboardStatsResponse.builder()
                .totalApartments(totalApts)
                .availableApartments(availableApts)
                .activeReservations(activeReservations)
                .soldApartments(soldApts)
                .pendingAppointments(pendingAppts)
                .pendingPayments(pendingPayments)
                .pendingAmount(pendingAmount != null ? pendingAmount : BigDecimal.ZERO)
                .unresolvedInquiries(unresolvedInq)
                .totalCustomers(totalCustomers)
                .totalUsers(totalUsers)
                .totalSalesCount(salesCount > 0 ? salesCount : soldApts)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .realizedRevenue(realizedRevenue)
                .monthRevenue(monthRevenue)
                .monthlySalesTrend(monthlySalesTrend)
                .build();
    }

    @Transactional(readOnly = true)
    public ReportDataResponse getReports() {
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

        // 4. Monthly sales count & monthly revenue (last 6 months)
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM");
        List<ChartPointDto> monthlySales = new ArrayList<>();
        List<ChartPointDto> monthlyRevenue = new ArrayList<>();
        YearMonth current = YearMonth.now();
        List<Sale> allSales = saleRepository.findAll();
        List<Payment> allVerified = paymentRepository.findByStatus(PaymentStatus.VERIFIED);

        for (int i = 5; i >= 0; i--) {
            YearMonth targetMonth = current.minusMonths(i);
            String label = targetMonth.format(monthFmt);

            long saleCount = allSales.stream()
                    .filter(s -> s.getSaleDate() != null && YearMonth.from(s.getSaleDate()).equals(targetMonth))
                    .count();

            // If sales table has no records for this month yet, count distinct verified apartments
            if (saleCount == 0) {
                saleCount = allVerified.stream()
                        .filter(p -> p.getVerifiedAt() != null && YearMonth.from(p.getVerifiedAt()).equals(targetMonth))
                        .map(p -> p.getApartment() != null ? p.getApartment().getId() : null)
                        .filter(id -> id != null)
                        .distinct()
                        .count();
            }

            long rev = allVerified.stream()
                    .filter(p -> p.getVerifiedAt() != null && YearMonth.from(p.getVerifiedAt()).equals(targetMonth))
                    .map(p -> p.getAmount().longValue())
                    .reduce(0L, Long::sum);

            monthlySales.add(new ChartPointDto(label, saleCount));
            monthlyRevenue.add(new ChartPointDto(label, rev));
        }

        BigDecimal totalRevenue = saleRepository.sumTotalSalesRevenue();
        if (totalRevenue == null || totalRevenue.compareTo(BigDecimal.ZERO) == 0) {
            totalRevenue = apartmentRepository.sumPriceByStatus(ApartmentStatus.SOLD);
            if (totalRevenue == null) {
                totalRevenue = BigDecimal.ZERO;
            }
        }

        BigDecimal totalPaid = paymentRepository.sumAmountByStatus(PaymentStatus.VERIFIED);
        if (totalPaid == null) totalPaid = BigDecimal.ZERO;

        long saleCount = saleRepository.count();
        if (saleCount == 0) saleCount = apartmentRepository.countByStatus(ApartmentStatus.SOLD);

        BigDecimal avgPrice = BigDecimal.ZERO;
        if (saleCount > 0 && totalRevenue != null) {
            avgPrice = totalRevenue.divide(BigDecimal.valueOf(saleCount), 0, RoundingMode.HALF_UP);
        }

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
                .inquiryCategories(inquiryCategories)
                .paymentTypes(paymentTypes)
                .districtStats(districtStats)
                .totalRevenue(totalRevenue)
                .avgSalePrice(avgPrice)
                .totalPaidAmount(totalPaid)
                .totalApartmentsListed(totalApartmentsListed)
                .build();
    }
}
