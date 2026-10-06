package com.skyline.dto.reservation;

import com.skyline.entity.Reservation;
import com.skyline.enums.ReservationStatus;
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
public class ReservationResponse {
    private String id;
    private String apartmentId;
    private String appointmentId;
    private String apartmentTitle;
    private String customerName;
    private String customerEmail;
    private BigDecimal reservationFee;
    private ReservationStatus status;
    private String expiresAt;
    private String createdAt;

    // Authoritative Reservation Timing Fields
    private String reservationFeeConfirmedAt;
    private String holdExpiresAt;
    private String cancellationDeadline;
    private boolean holdActive;
    private boolean cancellationEligible;
    private Long remainingHoldSeconds;
    private Long remainingCancellationSeconds;

    private boolean hasPaymentCommitment;
    private String paymentCommitmentReason;

    private boolean hasCompletedSale;
    private String saleId;
    private boolean isFullyPaid;

    private BigDecimal totalPaid;
    private BigDecimal otherPaidAmount;
    private BigDecimal refundableAmount;
    private BigDecimal nonRefundableFee;

    // Authoritative Reservation Financial Status
    private boolean reservationFeePaid;
    private BigDecimal verifiedPaid;
    private BigDecimal remainingBalance;
    private String refundStatus;
    private BigDecimal refundAmount;
    private BigDecimal companyRetainedAmount;
    private String refundProcessedAt;
    private String customerConfirmedAt;
    private boolean financiallyClosed;
    private boolean canPayReservationFee;
    private boolean canRequestSettlement;
    private boolean canConfirmRefund;
    private Integer settlementProgress;
    private String displayStatus;

    public static ReservationResponse fromEntity(Reservation r) {
        return fromEntity(r, false, null, false, null, false, null, null, null, null);
    }

    public static ReservationResponse fromEntity(Reservation r, java.time.LocalDateTime currentDateTime) {
        if (r == null) return null;
        java.time.LocalDateTime now = currentDateTime != null ? currentDateTime : java.time.LocalDateTime.now();
        boolean isConfirmed = r.getStatus() == ReservationStatus.CONFIRMED;

        String reservationFeeConfirmedAt = r.getReservationFeeConfirmedAt() != null
                ? r.getReservationFeeConfirmedAt().format(DateTimeFormatter.ISO_DATE_TIME)
                : null;
        String holdExpiresAt = (isConfirmed && r.getHoldExpiresAt() != null)
                ? r.getHoldExpiresAt().format(DateTimeFormatter.ISO_DATE_TIME)
                : null;
        String cancellationDeadline = (isConfirmed && r.getEffectiveCancellationDeadline() != null)
                ? r.getEffectiveCancellationDeadline().format(DateTimeFormatter.ISO_DATE_TIME)
                : null;

        boolean holdActive = isConfirmed && r.getHoldExpiresAt() != null && !now.isAfter(r.getHoldExpiresAt());
        boolean cancellationEligible = isConfirmed && r.getEffectiveCancellationDeadline() != null && !now.isAfter(r.getEffectiveCancellationDeadline());

        long remainingHoldSeconds = (holdActive && r.getHoldExpiresAt() != null)
                ? Math.max(0L, java.time.Duration.between(now, r.getHoldExpiresAt()).getSeconds())
                : 0L;
        long remainingCancellationSeconds = (cancellationEligible && r.getEffectiveCancellationDeadline() != null)
                ? Math.max(0L, java.time.Duration.between(now, r.getEffectiveCancellationDeadline()).getSeconds())
                : 0L;

        return fromEntity(r, false, null, false, null, false, null, null, null, null,
                false, null, null, null, null, null, null, null, false, false, false, false, 0, null,
                reservationFeeConfirmedAt, holdExpiresAt, cancellationDeadline,
                holdActive, cancellationEligible, remainingHoldSeconds, remainingCancellationSeconds);
    }

    public static ReservationResponse fromEntity(Reservation r, boolean hasPaymentCommitment, String paymentCommitmentReason) {
        return fromEntity(r, hasPaymentCommitment, paymentCommitmentReason, false, null, false, null, null, null, null);
    }

    public static ReservationResponse fromEntity(Reservation r, boolean hasPaymentCommitment, String paymentCommitmentReason,
                                                boolean hasCompletedSale, String saleId, boolean isFullyPaid) {
        return fromEntity(r, hasPaymentCommitment, paymentCommitmentReason, hasCompletedSale, saleId, isFullyPaid, null, null, null, null);
    }

    public static ReservationResponse fromEntity(Reservation r, boolean hasPaymentCommitment, String paymentCommitmentReason,
                                                boolean hasCompletedSale, String saleId, boolean isFullyPaid,
                                                BigDecimal totalPaid, BigDecimal otherPaidAmount,
                                                BigDecimal refundableAmount, BigDecimal nonRefundableFee) {
        return fromEntity(r, hasPaymentCommitment, paymentCommitmentReason, hasCompletedSale, saleId, isFullyPaid,
                totalPaid, otherPaidAmount, refundableAmount, nonRefundableFee,
                false, totalPaid, null, null, null, null, null, null, false, false, false, false, 0);
    }

    public static ReservationResponse fromEntity(Reservation r, boolean hasPaymentCommitment, String paymentCommitmentReason,
                                                boolean hasCompletedSale, String saleId, boolean isFullyPaid,
                                                BigDecimal totalPaid, BigDecimal otherPaidAmount,
                                                BigDecimal refundableAmount, BigDecimal nonRefundableFee,
                                                boolean reservationFeePaid, BigDecimal verifiedPaid, BigDecimal remainingBalance,
                                                String refundStatus, BigDecimal refundAmount, BigDecimal companyRetainedAmount,
                                                String refundProcessedAt, String customerConfirmedAt,
                                                boolean financiallyClosed, boolean canPayReservationFee,
                                                boolean canRequestSettlement, boolean canConfirmRefund,
                                                Integer settlementProgress) {
        return fromEntity(r, hasPaymentCommitment, paymentCommitmentReason,
                hasCompletedSale, saleId, isFullyPaid,
                totalPaid, otherPaidAmount, refundableAmount, nonRefundableFee,
                reservationFeePaid, verifiedPaid, remainingBalance,
                refundStatus, refundAmount, companyRetainedAmount,
                refundProcessedAt, customerConfirmedAt,
                financiallyClosed, canPayReservationFee,
                canRequestSettlement, canConfirmRefund,
                settlementProgress, null);
    }

    public static ReservationResponse fromEntity(Reservation r, boolean hasPaymentCommitment, String paymentCommitmentReason,
                                                boolean hasCompletedSale, String saleId, boolean isFullyPaid,
                                                BigDecimal totalPaid, BigDecimal otherPaidAmount,
                                                BigDecimal refundableAmount, BigDecimal nonRefundableFee,
                                                boolean reservationFeePaid, BigDecimal verifiedPaid, BigDecimal remainingBalance,
                                                String refundStatus, BigDecimal refundAmount, BigDecimal companyRetainedAmount,
                                                String refundProcessedAt, String customerConfirmedAt,
                                                boolean financiallyClosed, boolean canPayReservationFee,
                                                boolean canRequestSettlement, boolean canConfirmRefund,
                                                Integer settlementProgress, String displayStatus) {
        return fromEntity(r, hasPaymentCommitment, paymentCommitmentReason,
                hasCompletedSale, saleId, isFullyPaid,
                totalPaid, otherPaidAmount, refundableAmount, nonRefundableFee,
                reservationFeePaid, verifiedPaid, remainingBalance,
                refundStatus, refundAmount, companyRetainedAmount,
                refundProcessedAt, customerConfirmedAt,
                financiallyClosed, canPayReservationFee,
                canRequestSettlement, canConfirmRefund,
                settlementProgress, displayStatus,
                null, null, null, null, null, null, null);
    }

    public static ReservationResponse fromEntity(Reservation r, boolean hasPaymentCommitment, String paymentCommitmentReason,
                                                boolean hasCompletedSale, String saleId, boolean isFullyPaid,
                                                BigDecimal totalPaid, BigDecimal otherPaidAmount,
                                                BigDecimal refundableAmount, BigDecimal nonRefundableFee,
                                                boolean reservationFeePaid, BigDecimal verifiedPaid, BigDecimal remainingBalance,
                                                String refundStatus, BigDecimal refundAmount, BigDecimal companyRetainedAmount,
                                                String refundProcessedAt, String customerConfirmedAt,
                                                boolean financiallyClosed, boolean canPayReservationFee,
                                                boolean canRequestSettlement, boolean canConfirmRefund,
                                                Integer settlementProgress, String displayStatus,
                                                String reservationFeeConfirmedAt, String holdExpiresAt, String cancellationDeadline,
                                                Boolean holdActive, Boolean cancellationEligible,
                                                Long remainingHoldSeconds, Long remainingCancellationSeconds) {
        if (r == null) return null;

        boolean isConfirmed = r.getStatus() == ReservationStatus.CONFIRMED;

        // Authoritative timestamp resolution
        if (reservationFeeConfirmedAt == null && r.getReservationFeeConfirmedAt() != null) {
            reservationFeeConfirmedAt = r.getReservationFeeConfirmedAt().format(DateTimeFormatter.ISO_DATE_TIME);
        }

        if (holdExpiresAt == null && isConfirmed && r.getHoldExpiresAt() != null) {
            holdExpiresAt = r.getHoldExpiresAt().format(DateTimeFormatter.ISO_DATE_TIME);
        }

        if (cancellationDeadline == null && isConfirmed && r.getEffectiveCancellationDeadline() != null) {
            cancellationDeadline = r.getEffectiveCancellationDeadline().format(DateTimeFormatter.ISO_DATE_TIME);
        }

        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        if (holdActive == null) {
            holdActive = isConfirmed && r.getHoldExpiresAt() != null && !now.isAfter(r.getHoldExpiresAt()) && !isFullyPaid && !hasCompletedSale;
        }

        if (cancellationEligible == null) {
            cancellationEligible = isConfirmed && r.getEffectiveCancellationDeadline() != null && !now.isAfter(r.getEffectiveCancellationDeadline()) && !hasPaymentCommitment && !hasCompletedSale;
        }

        if (remainingHoldSeconds == null) {
            remainingHoldSeconds = (Boolean.TRUE.equals(holdActive) && r.getHoldExpiresAt() != null)
                    ? Math.max(0L, java.time.Duration.between(now, r.getHoldExpiresAt()).getSeconds())
                    : 0L;
        }

        if (remainingCancellationSeconds == null) {
            remainingCancellationSeconds = (Boolean.TRUE.equals(cancellationEligible) && r.getEffectiveCancellationDeadline() != null)
                    ? Math.max(0L, java.time.Duration.between(now, r.getEffectiveCancellationDeadline()).getSeconds())
                    : 0L;
        }

        // Only confirmed reservations have a hold expiration date. For pending reservations, hold has not started.
        String resolvedExpiresAt = isConfirmed
                ? (holdExpiresAt != null ? holdExpiresAt : (r.getExpiresAt() != null ? r.getExpiresAt().format(DateTimeFormatter.ISO_DATE_TIME) : ""))
                : "";

        return ReservationResponse.builder()
                .id(IdParser.formatId("RSV", r.getId()))
                .apartmentId(r.getApartment() != null ? IdParser.formatId("APT", r.getApartment().getId()) : "")
                .appointmentId(r.getAppointment() != null ? IdParser.formatId("APT-AP", r.getAppointment().getId()) : "")
                .apartmentTitle(r.getApartment() != null ? r.getApartment().getTitle() : "")
                .customerName(r.getCustomerName() != null ? r.getCustomerName() : (r.getCustomer() != null ? r.getCustomer().getName() : ""))
                .customerEmail(r.getCustomerEmail() != null ? r.getCustomerEmail() : (r.getCustomer() != null ? r.getCustomer().getEmail() : ""))
                .reservationFee(r.getReservationFee())
                .status(r.getStatus())
                .expiresAt(resolvedExpiresAt)
                .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : "")
                .reservationFeeConfirmedAt(reservationFeeConfirmedAt)
                .holdExpiresAt(holdExpiresAt)
                .cancellationDeadline(cancellationDeadline)
                .holdActive(Boolean.TRUE.equals(holdActive))
                .cancellationEligible(Boolean.TRUE.equals(cancellationEligible))
                .remainingHoldSeconds(remainingHoldSeconds)
                .remainingCancellationSeconds(remainingCancellationSeconds)
                .hasPaymentCommitment(hasPaymentCommitment)
                .paymentCommitmentReason(paymentCommitmentReason)
                .hasCompletedSale(hasCompletedSale)
                .saleId(saleId)
                .isFullyPaid(isFullyPaid)
                .totalPaid(totalPaid)
                .otherPaidAmount(otherPaidAmount)
                .refundableAmount(refundableAmount)
                .nonRefundableFee(nonRefundableFee)
                .reservationFeePaid(reservationFeePaid)
                .verifiedPaid(verifiedPaid != null ? verifiedPaid : BigDecimal.ZERO)
                .remainingBalance(remainingBalance != null ? remainingBalance : BigDecimal.ZERO)
                .refundStatus(refundStatus)
                .refundAmount(refundAmount)
                .companyRetainedAmount(companyRetainedAmount)
                .refundProcessedAt(refundProcessedAt)
                .customerConfirmedAt(customerConfirmedAt)
                .financiallyClosed(financiallyClosed)
                .canPayReservationFee(canPayReservationFee)
                .canRequestSettlement(canRequestSettlement)
                .canConfirmRefund(canConfirmRefund)
                .settlementProgress(settlementProgress != null ? settlementProgress : 0)
                .displayStatus(displayStatus)
                .build();
    }
}

