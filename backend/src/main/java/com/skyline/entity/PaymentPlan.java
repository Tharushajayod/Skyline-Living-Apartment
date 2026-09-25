package com.skyline.entity;

import com.skyline.enums.PaymentPlanStatus;
import com.skyline.enums.PaymentPlanType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_plans", indexes = {
    @Index(name = "idx_pp_reservation_id", columnList = "reservation_id"),
    @Index(name = "idx_pp_customer_id", columnList = "customer_id"),
    @Index(name = "idx_pp_status", columnList = "status"),
    @Index(name = "idx_pp_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentPlan {

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

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_type", nullable = false)
    private PaymentPlanType planType;

    @Column(name = "number_of_payments", nullable = false)
    private Integer numberOfPayments;

    @Column(
        name = "payment_amount",
        nullable = false,
        precision = 19,
        scale = 2
    )
    private BigDecimal paymentAmount;

    @Column(
        name = "total_plan_amount",
        nullable = false,
        precision = 19,
        scale = 2
    )
    private BigDecimal totalPlanAmount;

    @Column(
        name = "remaining_amount",
        nullable = false,
        precision = 19,
        scale = 2
    )
    private BigDecimal remainingAmount;

    @Column(
        name = "annual_interest_rate",
        precision = 10,
        scale = 2
    )
    private BigDecimal annualInterestRate;

    @Column(
        name = "interest_amount",
        precision = 19,
        scale = 2
    )
    private BigDecimal interestAmount;

    @Column(
        name = "additional_amount",
        precision = 19,
        scale = 2
    )
    private BigDecimal additionalAmount;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentPlanStatus status = PaymentPlanStatus.PENDING;

    @Column(name = "customer_notes", length = 2000)
    private String customerNotes;

    @Column(name = "admin_notes", length = 2000)
    private String adminNotes;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}