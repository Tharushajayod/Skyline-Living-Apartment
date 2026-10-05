package com.skyline.entity;

import com.skyline.enums.RefundStatus;
import com.skyline.enums.RefundType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservation_refunds", 
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_refund_res_id", columnNames = "reservation_id")
    },
    indexes = {
        @Index(name = "idx_refund_res_id", columnList = "reservation_id"),
        @Index(name = "idx_refund_cust_id", columnList = "customer_id"),
        @Index(name = "idx_refund_apt_id", columnList = "apartment_id"),
        @Index(name = "idx_refund_status", columnList = "refundStatus"),
        @Index(name = "idx_refund_created_at", columnList = "createdAt")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationRefund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "apartment_id", nullable = false)
    private Apartment apartment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal originalFee;

    @Column(precision = 18, scale = 2)
    private BigDecimal refundAmount;

    @Column(precision = 18, scale = 2)
    private BigDecimal companyRetainedAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RefundStatus refundStatus = RefundStatus.PENDING_REVIEW;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RefundType refundType = RefundType.CANCELLATION;

    @Column(length = 1000)
    private String reason;

    // Cancellation Initiator Audit Fields
    @Column(name = "initiated_by_role", length = 50)
    private String initiatedByRole; // CUSTOMER, STAFF, ADMIN

    @Column(name = "initiated_by_user_id")
    private Long initiatedByUserId;

    @Column(name = "initiated_by_name")
    private String initiatedByName;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;

    // Administrative Settlement Review Fields
    @Column(name = "reviewed_by")
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "settlement_note", length = 1000)
    private String settlementNote;

    // Manual Refund Disbursement Fields
    @Column(name = "processed_by")
    private String processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "refund_method", length = 100)
    private String refundMethod; // Bank Transfer, Cash, Other

    @Column(name = "transaction_reference")
    private String transactionReference;

    @Column(name = "proof_url", length = 1000)
    private String proofUrl;

    @Column(length = 1000)
    private String notes;

    // Customer Refund Confirmation / Acknowledgement Fields
    @Column(name = "customer_confirmed_at")
    private LocalDateTime customerConfirmedAt;

    @Column(name = "customer_confirmed_by")
    private String customerConfirmedBy;

    @Column(name = "customer_confirmed_user_id")
    private Long customerConfirmedUserId;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
