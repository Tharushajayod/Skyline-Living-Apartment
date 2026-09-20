package com.skyline.entity;

import com.skyline.enums.ReservationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations", indexes = {
    @Index(name = "idx_res_status", columnList = "status"),
    @Index(name = "idx_res_customer_id", columnList = "customer_id"),
    @Index(name = "idx_res_apartment_id", columnList = "apartment_id"),
    @Index(name = "idx_res_customer_email", columnList = "customerEmail"),
    @Index(name = "idx_res_expires_at", columnList = "expiresAt"),
    @Index(name = "idx_res_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {

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
    private String customerEmail;

    @Column(nullable = false)
    private BigDecimal reservationFee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReservationStatus status = ReservationStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
