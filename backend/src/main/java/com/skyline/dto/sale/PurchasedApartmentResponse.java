package com.skyline.dto.sale;

import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentImage;
import com.skyline.entity.OwnershipRecord;
import com.skyline.entity.Sale;
import com.skyline.util.IdParser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchasedApartmentResponse {

    private String saleId;
    private String apartmentId;
    private String apartmentNumber;
    private String title;
    private String buildingName;
    private String address;
    private String city;
    private String district;
    private String type;
    private Integer floor;
    private Double size;
    private Integer bedrooms;
    private Integer bathrooms;
    private String imageUrl;
    private List<String> images;
    private BigDecimal purchasePrice;
    private String purchaseDate;
    private String status;
    private String ownershipStatus;
    private String ownershipDate;
    private String reservationId;
    private String staffName;

    public static PurchasedApartmentResponse fromSale(Sale sale, OwnershipRecord ownershipRecord) {
        if (sale == null) return null;
        Apartment apt = sale.getApartment();

        String primaryImg = "";
        List<String> imgUrls = new ArrayList<>();
        if (apt != null && apt.getImages() != null && !apt.getImages().isEmpty()) {
            imgUrls = apt.getImages().stream().map(ApartmentImage::getUrl).collect(Collectors.toList());
            primaryImg = imgUrls.get(0);
        }

        return PurchasedApartmentResponse.builder()
                .saleId(IdParser.formatId("SAL", sale.getId()))
                .apartmentId(apt != null ? IdParser.formatId("APT", apt.getId()) : "")
                .apartmentNumber(apt != null ? apt.getApartmentNumber() : "")
                .title(sale.getApartmentTitle() != null ? sale.getApartmentTitle() : (apt != null ? apt.getTitle() : "Skyline Residence"))
                .buildingName(apt != null ? apt.getBuildingName() : "")
                .address(apt != null ? apt.getAddress() : "")
                .city(apt != null ? apt.getCity() : "")
                .district(apt != null ? apt.getDistrict() : "")
                .type(apt != null && apt.getType() != null ? apt.getType().getDisplayValue() : "")
                .floor(apt != null ? apt.getFloor() : null)
                .size(apt != null ? apt.getSize() : null)
                .bedrooms(apt != null ? apt.getBedrooms() : null)
                .bathrooms(apt != null ? apt.getBathrooms() : null)
                .imageUrl(primaryImg)
                .images(imgUrls)
                .purchasePrice(sale.getFinalPrice())
                .purchaseDate(sale.getSaleDate() != null ? sale.getSaleDate().toString() : "")
                .status("Purchased")
                .ownershipStatus(ownershipRecord != null ? "Deed Transferred" : "Sale Completed")
                .ownershipDate(ownershipRecord != null && ownershipRecord.getOwnershipDate() != null
                        ? ownershipRecord.getOwnershipDate().toString()
                        : (sale.getSaleDate() != null ? sale.getSaleDate().toString() : ""))
                .reservationId(sale.getReservation() != null ? IdParser.formatId("RSV", sale.getReservation().getId()) : "")
                .staffName(sale.getStaffName() != null ? sale.getStaffName() : "Skyline Sales Desk")
                .build();
    }
}
