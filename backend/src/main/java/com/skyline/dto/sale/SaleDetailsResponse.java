package com.skyline.dto.sale;

import com.skyline.dto.apartment.ApartmentResponse;
import com.skyline.dto.payment.PaymentPlanResponse;
import com.skyline.dto.payment.PaymentResponse;
import com.skyline.dto.reservation.ReservationResponse;
import com.skyline.dto.user.UserDto;
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
public class SaleDetailsResponse {
    private SaleResponse sale;
    private UserDto customer;
    private ApartmentResponse apartment;
    private ReservationResponse reservation;
    private PaymentSummaryDto paymentSummary;
    private List<PaymentResponse> payments;
    private PaymentPlanResponse paymentPlan;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentSummaryDto {
        private BigDecimal apartmentPrice;
        private BigDecimal totalVerifiedPayments;
        private BigDecimal remainingBalance;
        private int paymentCount;
    }
}
