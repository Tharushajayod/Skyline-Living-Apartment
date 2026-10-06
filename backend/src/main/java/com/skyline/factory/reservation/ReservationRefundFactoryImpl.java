package com.skyline.factory.reservation;

import com.skyline.dto.reservation.ReservationCancellationRequest;
import com.skyline.entity.Payment;
import com.skyline.entity.Reservation;
import com.skyline.entity.ReservationRefund;
import com.skyline.enums.RefundStatus;
import com.skyline.enums.RefundType;
import com.skyline.enums.UserRole;
import com.skyline.security.UserPrincipal;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Factory Pattern: Concrete Factory Implementation for ReservationRefund entities.
 */
@Component
public class ReservationRefundFactoryImpl implements ReservationRefundFactory {

    @Override
    public ReservationRefund createCustomerCancellationRefund(
            Reservation reservation,
            Payment payment,
            ReservationCancellationRequest request,
            UserPrincipal principal,
            BigDecimal depositAmount) {

        String customerName = principal != null && principal.getUser() != null ? principal.getUser().getName()
                : (reservation.getCustomer() != null ? reservation.getCustomer().getName() : "Customer");
        Long customerId = principal != null ? principal.getId()
                : (reservation.getCustomer() != null ? reservation.getCustomer().getId() : null);

        // Factory Pattern: Construct product with Customer-Initiated Cancellation defaults
        return ReservationRefund.builder()
                .reservation(reservation)
                .payment(payment)
                .customer(reservation.getCustomer())
                .apartment(reservation.getApartment())
                .originalFee(depositAmount)
                .refundAmount(null) // Unset / pending decision until administrative review
                .companyRetainedAmount(null) // Unset / pending decision until review
                .refundStatus(RefundStatus.PENDING_REVIEW)
                .refundType(RefundType.CANCELLATION)
                .reason(request != null && request.getReason() != null ? request.getReason().trim() : "Customer requested cancellation")
                .notes(request != null ? request.getNotes() : null)
                .requestedAt(LocalDateTime.now())
                .initiatedByRole(UserRole.CUSTOMER.name())
                .initiatedByUserId(customerId)
                .initiatedByName(customerName)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Override
    public ReservationRefund createManagementCancellationRefund(
            Reservation reservation,
            Payment payment,
            ReservationCancellationRequest request,
            UserPrincipal principal,
            BigDecimal depositAmount) {

        String staffName = principal != null && principal.getUser() != null ? principal.getUser().getName() : "Skyline Management";
        Long staffId = principal != null ? principal.getId() : null;
        String roleName = principal != null && principal.getUser() != null ? principal.getUser().getRole().name() : UserRole.STAFF.name();

        // Factory Pattern: Construct product with Management-Initiated Cancellation defaults (100% full refund)
        return ReservationRefund.builder()
                .reservation(reservation)
                .payment(payment)
                .customer(reservation.getCustomer())
                .apartment(reservation.getApartment())
                .originalFee(depositAmount)
                .refundAmount(depositAmount)
                .companyRetainedAmount(BigDecimal.ZERO)
                .refundStatus(RefundStatus.PENDING_PAYMENT)
                .refundType(RefundType.CANCELLATION)
                .reason(request != null && request.getReason() != null ? request.getReason().trim() : "Management cancelled reservation")
                .notes(request != null ? request.getNotes() : null)
                .requestedAt(LocalDateTime.now())
                .initiatedByRole(roleName)
                .initiatedByUserId(staffId)
                .initiatedByName(staffName)
                .reviewedBy(staffName)
                .reviewedAt(LocalDateTime.now())
                .settlementNote("Full refund approved per management cancellation policy.")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Override
    public ReservationRefund createExpiredReservationRefund(
            Reservation reservation,
            Payment payment,
            ReservationCancellationRequest request,
            UserPrincipal principal,
            BigDecimal depositAmount,
            BigDecimal retainedFee) {

        String actorName = principal != null && principal.getUser() != null ? principal.getUser().getName() : "System Expiration Service";
        Long actorId = principal != null ? principal.getId() : null;
        String roleName = principal != null && principal.getUser() != null ? principal.getUser().getRole().name() : "SYSTEM";

        BigDecimal safeRetained = retainedFee != null ? retainedFee : BigDecimal.ZERO;
        BigDecimal calculatedRefund = depositAmount.subtract(safeRetained);
        if (calculatedRefund.compareTo(BigDecimal.ZERO) < 0) {
            calculatedRefund = BigDecimal.ZERO;
        }

        // Factory Pattern: Construct product with Expired Reservation settlement defaults
        return ReservationRefund.builder()
                .reservation(reservation)
                .payment(payment)
                .customer(reservation.getCustomer())
                .apartment(reservation.getApartment())
                .originalFee(depositAmount)
                .refundAmount(calculatedRefund)
                .companyRetainedAmount(safeRetained)
                .refundStatus(RefundStatus.APPROVED)
                .refundType(RefundType.EXPIRATION)
                .reason(request != null && request.getReason() != null ? request.getReason().trim() : "Reservation expired beyond validity period")
                .notes(request != null ? request.getNotes() : null)
                .requestedAt(LocalDateTime.now())
                .initiatedByRole(roleName)
                .initiatedByUserId(actorId)
                .initiatedByName(actorName)
                .reviewedBy(actorName)
                .reviewedAt(LocalDateTime.now())
                .settlementNote("Standard cancellation policy applied upon expiration.")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
