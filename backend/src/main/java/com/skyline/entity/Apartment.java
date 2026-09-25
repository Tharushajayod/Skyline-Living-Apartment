package com.skyline.entity;

import com.skyline.enums.ApartmentType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.BatchSize;

@Entity
@Table(name = "apartments", indexes = {
    @Index(name = "idx_apt_status", columnList = "status"),
    @Index(name = "idx_apt_type", columnList = "type"),
    @Index(name = "idx_apt_price", columnList = "price"),
    @Index(name = "idx_apt_district", columnList = "district"),
    @Index(name = "idx_apt_bedrooms", columnList = "bedrooms"),
    @Index(name = "idx_apt_featured", columnList = "featured"),
    @Index(name = "idx_apt_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Apartment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String apartmentNumber;

    @Column(nullable = false)
    private String title;

    private String buildingName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApartmentType type = ApartmentType.TWO_BEDROOM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApartmentStatus status = ApartmentStatus.AVAILABLE;

    @Column(nullable = false)
    private BigDecimal price;

    private Integer floor;

    private Double size;

    private Integer bedrooms;

    private Integer bathrooms;

    private String address;

    private String city;

    private String district;

    @Column(length = 4000)
    private String description;

    private Integer yearBuilt;

    @OneToMany(mappedBy = "apartment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @BatchSize(size = 25)
    @Builder.Default
    private List<ApartmentImage> images = new ArrayList<>();

    private String floorPlanUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "apartment_facilities", joinColumns = @JoinColumn(name = "apartment_id"))
    @Column(name = "facility_name")
    @BatchSize(size = 25)
    @Builder.Default
    private List<String> facilitiesList = new ArrayList<>();

    private Double latitude;

    private Double longitude;

    @Builder.Default
    private Boolean featured = false;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public void addImage(ApartmentImage image) {
        images.add(image);
        image.setApartment(this);
    }

    public void removeImage(ApartmentImage image) {
        images.remove(image);
        image.setApartment(null);
    }
}