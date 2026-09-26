package com.skyline.entity;

import com.skyline.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointment_reschedule_history", indexes = {
    @Index(name = "idx_resched_appt_id", columnList = "appointment_id"),
    @Index(name = "idx_resched_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentRescheduleHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @Column(nullable = false)
    private LocalDate oldDate;

    @Column(nullable = false)
    private String oldTimeSlot;

    @Column(nullable = false)
    private LocalDate newDate;

    @Column(nullable = false)
    private String newTimeSlot;

    @Column(nullable = false, length = 1000)
    private String reason;

    private String changedBy;

    @Enumerated(EnumType.STRING)
    private UserRole changedByRole;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
