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

    // Initiator Audit Fields
    private String initiatedByRole;
    private Long initiatedByUserId;
    private String initiatedByName;
    private String requestedAt;

    // Review / Settlement Audit Fields
    private String reviewedBy;
    private String reviewedAt;
    private String settlementNote;

    // Payment Audit Fields
    private String processedBy;
    private String processedAt;
    private String refundMethod;
    private String transactionReference;
    private String proofUrl;

    private String notes;
    private String createdAt;

    // Customer Refund Confirmation / Acknowledgement Fields
    private String customerConfirmedAt;
    private String customerConfirmedBy;
    private Long customerConfirmedUserId;
    private Boolean canCustomerConfirm;

    // Additional fields for cancellation response
    private String reservationStatus;
    private Boolean refundEligible;
    private String refundRequestedAt;
    private String message;

    public static ReservationRefundResponse fromEntity(ReservationRefund r) {
        if (r == null) return null;
        String reqAt = r.getRequestedAt() != null 
                ? r.getRequestedAt().format(DateTimeFormatter.ISO_DATE_TIME) 
                : (r.getCreatedAt() != null ? r.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null);
        String revAt = r.getReviewedAt() != null ? r.getReviewedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null;
        String procAt = r.getProcessedAt() != null ? r.getProcessedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null;
        String confAt = r.getCustomerConfirmedAt() != null ? r.getCustomerConfirmedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null;
        String createAt = r.getCreatedAt() != null ? r.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null;
        boolean canConfirm = r.getRefundStatus() == RefundStatus.PROCESSED;

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
                .initiatedByRole(r.getInitiatedByRole())
                .initiatedByUserId(r.getInitiatedByUserId())
                .initiatedByName(r.getInitiatedByName())
                .requestedAt(reqAt)
                .refundRequestedAt(reqAt)
                .reviewedBy(r.getReviewedBy())
                .reviewedAt(revAt)
                .settlementNote(r.getSettlementNote())
                .processedBy(r.getProcessedBy())
                .processedAt(procAt)
                .refundMethod(r.getRefundMethod())
                .transactionReference(r.getTransactionReference())
                .proofUrl(r.getProofUrl())
                .customerConfirmedAt(confAt)
                .customerConfirmedBy(r.getCustomerConfirmedBy())
                .customerConfirmedUserId(r.getCustomerConfirmedUserId())
                .canCustomerConfirm(canConfirm)
                .notes(r.getNotes())
                .createdAt(createAt)
                .reservationStatus(r.getReservation() != null && r.getReservation().getStatus() != null ? r.getReservation().getStatus().name() : null)
                .refundEligible(true)
                .message("Reservation refund record loaded.")
                .build();
    }
}
