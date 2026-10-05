package com.skyline.dto.apartment;

import com.skyline.entity.ApartmentStatus;
import com.skyline.enums.ApartmentType;
import com.skyline.validation.ValidYearBuilt;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
    @DecimalMin(value = "0.01", inclusive = true, message = "Price must be greater than Rs. 0")
    private BigDecimal price;

    @NotNull(message = "Floor is required")
    @Min(value = 0, message = "Floor cannot be negative")
    private Integer floor;

    @NotNull(message = "Size is required")
    @DecimalMin(value = "0.01", inclusive = true, message = "Size must be greater than 0 sqm")
    private Double size;

    @NotNull(message = "Bedrooms is required")
    @Min(value = 1, message = "Bedrooms must be at least 1")
    private Integer bedrooms;

    @NotNull(message = "Bathrooms is required")
    @Min(value = 1, message = "Bathrooms must be at least 1")
    private Integer bathrooms;

    private String address;

    private String city;

    private String district;

    private String description;

    @NotNull(message = "Year built is required")
    @ValidYearBuilt
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
