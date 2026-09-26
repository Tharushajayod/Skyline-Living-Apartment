package com.skyline.entity;

import com.skyline.enums.AppointmentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments", indexes = {
    @Index(name = "idx_app_status", columnList = "status"),
    @Index(name = "idx_app_customer_id", columnList = "customer_id"),
    @Index(name = "idx_app_apartment_id", columnList = "apartment_id"),
    @Index(name = "idx_app_date", columnList = "date"),
    @Index(name = "idx_app_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

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
    private String customerPhone;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String timeSlot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private com.skyline.enums.RescheduleStatus rescheduleStatus = com.skyline.enums.RescheduleStatus.NONE;

    private LocalDate proposedDate;

    private String proposedTimeSlot;

    @Column(length = 1000)
    private String rescheduleReason;

    private String rescheduleRequestedBy;

    @Enumerated(EnumType.STRING)
    private com.skyline.enums.UserRole rescheduleRequestedByRole;

    private LocalDateTime rescheduleRequestedAt;

    @Column(length = 2000)
    private String notes;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
