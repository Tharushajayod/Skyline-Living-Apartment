package com.skyline.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales", indexes = {
    @Index(name = "idx_sale_apt_id", columnList = "apartment_id"),
    @Index(name = "idx_sale_customer_id", columnList = "customer_id"),
    @Index(name = "idx_sale_date", columnList = "saleDate"),
    @Index(name = "idx_sale_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "apartment_id", nullable = false, unique = true)
    private Apartment apartment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    private String customerName;
    private String customerEmail;
    private String apartmentTitle;

    @Column(nullable = false)
    private BigDecimal finalPrice;

    @Column(nullable = false)
    private LocalDate saleDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "staff_id")
    private User staff;

    private String staffName;

    @Column(name = "ownership_status")
    @Builder.Default
    private String ownershipStatus = "Deed Transferred";

    @Column(name = "ownership_date")
    private LocalDate ownershipDate;

    @Column(name = "deed_reference_number")
    private String deedReferenceNumber;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
