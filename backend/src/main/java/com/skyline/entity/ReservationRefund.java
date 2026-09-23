package com.skyline.entity;

import com.skyline.enums.RefundStatus;
import com.skyline.enums.RefundType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservation_refunds", indexes = {
    @Index(name = "idx_refund_res_id", columnList = "reservation_id"),
    @Index(name = "idx_refund_cust_id", columnList = "customer_id"),
    @Index(name = "idx_refund_apt_id", columnList = "apartment_id"),
    @Index(name = "idx_refund_status", columnList = "refundStatus"),
    @Index(name = "idx_refund_created_at", columnList = "createdAt")
})
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

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal refundAmount;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal companyRetainedAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RefundStatus refundStatus = RefundStatus.PROCESSED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RefundType refundType = RefundType.CANCELLATION;

    @Column(length = 1000)
    private String reason;

    private String processedBy;

    private LocalDateTime processedAt;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
