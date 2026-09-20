package com.skyline.dto.apartment;

import com.skyline.entity.ApartmentStatus;
import com.skyline.enums.ApartmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApartmentRequest {

    private String apartmentNumber;

    @NotBlank(message = "Title is required")
    private String title;

    private String buildingName;

    private ApartmentType type;

    private ApartmentStatus status;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    private Integer floor;

    private Double size;

    private Integer bedrooms;

    private Integer bathrooms;

    private String address;

    private String city;

    private String district;

    private String description;

    private Integer yearBuilt;

    private List<ApartmentImageDto> images;

    private String floorPlanUrl;

    private List<String> facilities;

    private Double latitude;

    private Double longitude;

    private Boolean featured;

    // Legacy fields
    private Double area;
    private Integer floorNumber;
    private String location;
    private String facilitiesString;
    private String imageUrl;
}
