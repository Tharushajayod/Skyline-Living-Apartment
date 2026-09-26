package com.skyline.entity;

import com.skyline.enums.ReviewStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews", indexes = {
    @Index(name = "idx_rev_apartment_id", columnList = "apartment_id"),
    @Index(name = "idx_rev_customer_id", columnList = "customer_id"),
    @Index(name = "idx_rev_status", columnList = "status"),
    @Index(name = "idx_rev_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "apartment_id", nullable = false)
    private Apartment apartment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    private String customerName;
    private String apartmentTitle;

    @Column(nullable = false)
    @Min(1)
    @Max(5)
    private Integer rating;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 4000)
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReviewStatus status = ReviewStatus.PENDING;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
