package com.skyline.entity;

import com.skyline.enums.PaymentStatus;
import com.skyline.enums.PaymentType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_pay_status", columnList = "status"),
    @Index(name = "idx_pay_customer_id", columnList = "customer_id"),
    @Index(name = "idx_pay_reservation_id", columnList = "reservation_id"),
    @Index(name = "idx_pay_apartment_id", columnList = "apartment_id"),
    @Index(name = "idx_pay_plan_id", columnList = "payment_plan_id"),
    @Index(name = "idx_pay_type", columnList = "type"),
    @Index(name = "idx_pay_uploaded_at", columnList = "uploadedAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "apartment_id", nullable = false)
    private Apartment apartment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "payment_plan_id")
    private PaymentPlan paymentPlan;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "payment_plan_item_id")
    private PaymentPlanItem paymentPlanItem;

    private String customerName;
    private String apartmentTitle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentType type;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    private String proofUrl;
    private String receiptUrl;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();

    private LocalDateTime verifiedAt;
    private String verifiedBy;

    @Column(length = 2000)
    private String notes;
}
