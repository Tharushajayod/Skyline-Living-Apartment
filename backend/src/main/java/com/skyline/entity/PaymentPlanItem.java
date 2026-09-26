package com.skyline.entity;

import com.skyline.enums.PaymentPlanItemStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "payment_plan_items",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "UK_plan_sequence",
                        columnNames = {
                                "payment_plan_id",
                                "sequence_no"
                        }
                )
        },
        indexes = {
                @Index(name = "idx_ppi_plan_id", columnList = "payment_plan_id"),
                @Index(name = "idx_ppi_status", columnList = "status"),
                @Index(name = "idx_ppi_due_date", columnList = "due_date")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentPlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(
            name = "payment_plan_id",
            nullable = false
    )
    private PaymentPlan paymentPlan;

    @Column(name = "sequence_no", nullable = false)
    private Integer sequenceNo;

    @Column(
            nullable = false,
            precision = 19,
            scale = 2
    )
    private BigDecimal amount;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentPlanItemStatus status =
            PaymentPlanItemStatus.UPCOMING;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt =
            LocalDateTime.now();
}