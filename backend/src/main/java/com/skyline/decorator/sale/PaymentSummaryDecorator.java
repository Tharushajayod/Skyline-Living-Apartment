package com.skyline.decorator.sale;

import com.skyline.dto.payment.PaymentResponse;
import com.skyline.dto.sale.SaleDetailsResponse;
import com.skyline.entity.Apartment;
import com.skyline.entity.Payment;
import com.skyline.entity.Reservation;
import com.skyline.entity.Sale;
import com.skyline.enums.PaymentStatus;
import com.skyline.repository.PaymentRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Decorator Pattern: Concrete Decorator for Payment Summary and Records.
 *
 * Enriches the base sale statement with financial aggregation, calculating
 * total verified payments, remaining apartment balance, and attaching the
 * full chronological payment transaction history.
 */
public class PaymentSummaryDecorator extends SaleStatementDecorator {

    private final Sale sale;
    private final PaymentRepository paymentRepository;

    public PaymentSummaryDecorator(SaleStatementComponent decoratedStatement,
                                   Sale sale,
                                   PaymentRepository paymentRepository) {
        super(decoratedStatement);
        this.sale = sale;
        this.paymentRepository = paymentRepository;
    }

    @Override
    public SaleDetailsResponse generateStatement() {
        // Decorator Pattern: Delegate to wrapped component first
        SaleDetailsResponse response = super.generateStatement();

        if (sale == null || paymentRepository == null) {
            return response;
        }

        Apartment apartment = sale.getApartment();
        Reservation reservation = sale.getReservation();

        // Payments: Fetch by Apartment ID and Reservation ID to capture all transactions
        Map<Long, Payment> paymentMap = new LinkedHashMap<>();
        if (apartment != null && apartment.getId() != null) {
            List<Payment> aptPayments = paymentRepository.findByApartmentId(apartment.getId());
            for (Payment p : aptPayments) {
                paymentMap.put(p.getId(), p);
            }
        }
        if (reservation != null && reservation.getId() != null) {
            List<Payment> rsvPayments = paymentRepository.findByReservationId(reservation.getId());
            for (Payment p : rsvPayments) {
                paymentMap.put(p.getId(), p);
            }
        }

        List<Payment> allPayments = new ArrayList<>(paymentMap.values());
        allPayments.sort((a, b) -> {
            if (a.getUploadedAt() != null && b.getUploadedAt() != null) {
                return b.getUploadedAt().compareTo(a.getUploadedAt());
            }
            return Long.compare(b.getId() != null ? b.getId() : 0, a.getId() != null ? a.getId() : 0);
        });

        List<PaymentResponse> paymentResponses = allPayments.stream()
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());

        // Financial Summary Calculations
        BigDecimal verifiedTotal = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.VERIFIED && p.getAmount() != null)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal price = sale.getFinalPrice() != null ? sale.getFinalPrice() :
                (apartment != null && apartment.getPrice() != null ? apartment.getPrice() : BigDecimal.ZERO);

        BigDecimal remainingBalance = price.subtract(verifiedTotal);
        if (remainingBalance.compareTo(BigDecimal.ZERO) < 0) {
            remainingBalance = BigDecimal.ZERO;
        }

        SaleDetailsResponse.PaymentSummaryDto paymentSummary = SaleDetailsResponse.PaymentSummaryDto.builder()
                .apartmentPrice(price)
                .totalVerifiedPayments(verifiedTotal)
                .remainingBalance(remainingBalance)
                .paymentCount(allPayments.size())
                .build();

        // Decorator Pattern: Attach enhanced responsibility to response
        response.setPaymentSummary(paymentSummary);
        response.setPayments(paymentResponses);

        return response;
    }
}
