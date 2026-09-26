package com.skyline.dto.reservation;

import com.skyline.entity.ReservationRefund;
import com.skyline.enums.RefundStatus;
import com.skyline.enums.RefundType;
import com.skyline.util.IdParser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationRefundResponse {

    private String id;
    private String reservationId;
    private String apartmentId;
    private String apartmentTitle;
    private String customerId;
    private String customerName;
    private String customerEmail;
    private String paymentId;
    private BigDecimal originalFee;
    private BigDecimal refundAmount;
    private BigDecimal companyRetainedAmount;
    private RefundStatus refundStatus;
    private RefundType refundType;
    private String reason;
    private String processedBy;
    private String processedAt;
    private String notes;
    private String createdAt;

    public static ReservationRefundResponse fromEntity(ReservationRefund r) {
        if (r == null) return null;
        return ReservationRefundResponse.builder()
                .id(IdParser.formatId("REF", r.getId()))
                .reservationId(r.getReservation() != null ? IdParser.formatId("RSV", r.getReservation().getId()) : "")
                .apartmentId(r.getApartment() != null ? IdParser.formatId("APT", r.getApartment().getId()) : "")
                .apartmentTitle(r.getApartment() != null ? r.getApartment().getTitle() : "")
                .customerId(r.getCustomer() != null ? IdParser.formatId("USR", r.getCustomer().getId()) : "")
                .customerName(r.getCustomer() != null ? r.getCustomer().getName() : "")
                .customerEmail(r.getCustomer() != null ? r.getCustomer().getEmail() : "")
                .paymentId(r.getPayment() != null ? IdParser.formatId("PAY", r.getPayment().getId()) : "")
                .originalFee(r.getOriginalFee())
                .refundAmount(r.getRefundAmount())
                .companyRetainedAmount(r.getCompanyRetainedAmount())
                .refundStatus(r.getRefundStatus())
                .refundType(r.getRefundType())
                .reason(r.getReason())
                .processedBy(r.getProcessedBy())
                .processedAt(r.getProcessedAt() != null ? r.getProcessedAt().format(DateTimeFormatter.ISO_DATE_TIME) : "")
                .notes(r.getNotes())
                .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : "")
                .build();
    }
}
