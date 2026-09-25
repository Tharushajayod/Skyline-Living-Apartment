package com.skyline.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EligibleApartmentResponse {
    private String id;
    private Long numericId;
    private String apartmentNumber;
    private String title;
    private String buildingName;
    private String type;
    private BigDecimal price;
    private Integer floor;
    private Double size;
    private Integer bedrooms;
    private Integer bathrooms;
    private String imageUrl;
    private String address;
    private String city;
    private String relationshipType; // "PURCHASED" or "RESERVED"
    private String relationshipLabel; // "Purchased" or "Reserved"
    private boolean hasReviewed;
    private String existingReviewId;
    private String existingReviewStatus;
    private Integer existingReviewRating;
    private String existingReviewTitle;
    private String existingReviewComment;
}
