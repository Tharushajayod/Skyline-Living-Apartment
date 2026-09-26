package com.skyline.dto.apartment;

import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.enums.ApartmentType;
import com.skyline.util.IdParser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApartmentResponse {
    private String id;
    private String apartmentNumber;
    private String title;
    private String buildingName;
    private ApartmentType type;
    private ApartmentStatus status;
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
    private String createdAt;

    // Legacy fields for backward compatibility
    private Double area;
    private Integer floorNumber;
    private String location;
    private String imageUrl;

    public static ApartmentResponse fromEntity(Apartment apt) {
        if (apt == null) return null;

        List<ApartmentImageDto> imageDtos = new ArrayList<>();
        if (apt.getImages() != null && !apt.getImages().isEmpty()) {
            imageDtos = apt.getImages().stream()
                    .map(ApartmentImageDto::fromEntity)
                    .collect(Collectors.toList());
        }

        List<String> facList = new ArrayList<>();
        if (apt.getFacilitiesList() != null && !apt.getFacilitiesList().isEmpty()) {
            facList = new ArrayList<>(apt.getFacilitiesList());
        }

        Integer effectiveFloor = apt.getFloor();
        Double effectiveSize = apt.getSize();
        String effectiveAddress = apt.getAddress() != null ? apt.getAddress() : "";
        String effectiveCity = apt.getCity() != null ? apt.getCity() : "";
        String effectiveDistrict = apt.getDistrict() != null ? apt.getDistrict() : effectiveCity;
        
        String firstImg = !imageDtos.isEmpty() ? imageDtos.get(0).getUrl() : "";

        return ApartmentResponse.builder()
                .id(IdParser.formatId("APT", apt.getId()))
                .apartmentNumber(apt.getApartmentNumber())
                .title(apt.getTitle())
                .buildingName(apt.getBuildingName() != null ? apt.getBuildingName() : "Skyline Tower")
                .type(apt.getType() != null ? apt.getType() : ApartmentType.TWO_BEDROOM)
                .status(apt.getStatus() != null ? apt.getStatus() : ApartmentStatus.AVAILABLE)
                .price(apt.getPrice())
                .floor(effectiveFloor != null ? effectiveFloor : 1)
                .size(effectiveSize != null ? effectiveSize : 0.0)
                .bedrooms(apt.getBedrooms() != null ? apt.getBedrooms() : 1)
                .bathrooms(apt.getBathrooms() != null ? apt.getBathrooms() : 1)
                .address(effectiveAddress)
                .city(effectiveCity)
                .district(effectiveDistrict)
                .description(apt.getDescription() != null ? apt.getDescription() : "")
                .yearBuilt(apt.getYearBuilt() != null ? apt.getYearBuilt() : 2024)
                .images(imageDtos)
                .floorPlanUrl(apt.getFloorPlanUrl() != null ? apt.getFloorPlanUrl() : "")
                .facilities(facList)
                .latitude(apt.getLatitude() != null ? apt.getLatitude() : 6.9271)
                .longitude(apt.getLongitude() != null ? apt.getLongitude() : 79.8612)
                .featured(apt.getFeatured() != null ? apt.getFeatured() : false)
                .createdAt(apt.getCreatedAt() != null ? apt.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : "")
                // legacy fields
                .area(effectiveSize)
                .floorNumber(effectiveFloor)
                .location(effectiveAddress)
                .imageUrl(firstImg)
                .build();
    }
}