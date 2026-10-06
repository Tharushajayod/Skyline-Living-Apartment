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
    @Index(name = "idx_res_created_at", columnList = "createdAt"),
    @Index(name = "idx_res_fee_confirmed_at", columnList = "reservation_fee_confirmed_at"),
    @Index(name = "idx_res_cancel_deadline", columnList = "cancellation_deadline")
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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    private String customerName;
    private String customerEmail;

    @Column(nullable = false)
    private BigDecimal reservationFee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReservationStatus status = ReservationStatus.PENDING;

    /**
     * Authoritative timestamp when the reservation fee was successfully paid and verified.
     * All subsequent windows (4-day hold and 48-hour cancellation window) start strictly from this timestamp.
     */
    @Column(name = "reservation_fee_confirmed_at")
    private LocalDateTime reservationFeeConfirmedAt;

    /**
     * The 4-Day Reservation Hold expiration timestamp.
     * Calculated as reservationFeeConfirmedAt + 4 days.
     * NULL while reservation is PENDING (fee not yet confirmed).
     */
    @Column(nullable = true)
    private LocalDateTime expiresAt;

    /**
     * The 48-Hour Cancellation / Refund Window deadline timestamp.
     * Calculated as reservationFeeConfirmedAt + 48 hours.
     * NULL while reservation is PENDING (fee not yet confirmed).
     */
    @Column(name = "cancellation_deadline")
    private LocalDateTime cancellationDeadline;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public LocalDateTime getHoldExpiresAt() {
        if (expiresAt != null) {
            return expiresAt;
        }
        return reservationFeeConfirmedAt != null ? reservationFeeConfirmedAt.plusDays(4) : null;
    }

    public LocalDateTime getEffectiveCancellationDeadline() {
        if (cancellationDeadline != null) {
            return cancellationDeadline;
        }
        return reservationFeeConfirmedAt != null ? reservationFeeConfirmedAt.plusHours(48) : null;
    }
}

