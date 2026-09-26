package com.skyline.dto.sale;

import com.skyline.entity.Sale;
import com.skyline.util.IdParser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaleResponse {
    private String id;
    private String apartmentId;
    private String apartmentTitle;
    private String customerName;
    private String customerEmail;
    private BigDecimal finalPrice;
    private String reservationId;
    private String saleDate;
    private String staffName;

    public static SaleResponse fromEntity(Sale s) {
        if (s == null) return null;
        return SaleResponse.builder()
                .id(IdParser.formatId("SAL", s.getId()))
                .apartmentId(s.getApartment() != null ? IdParser.formatId("APT", s.getApartment().getId()) : "")
                .apartmentTitle(s.getApartmentTitle() != null ? s.getApartmentTitle() : (s.getApartment() != null ? s.getApartment().getTitle() : ""))
                .customerName(s.getCustomerName() != null ? s.getCustomerName() : (s.getCustomer() != null ? s.getCustomer().getName() : ""))
                .customerEmail(s.getCustomerEmail() != null ? s.getCustomerEmail() : (s.getCustomer() != null ? s.getCustomer().getEmail() : ""))
                .finalPrice(s.getFinalPrice())
                .reservationId(s.getReservation() != null ? IdParser.formatId("RSV", s.getReservation().getId()) : "")
                .saleDate(s.getSaleDate() != null ? s.getSaleDate().toString() : "")
                .staffName(s.getStaffName() != null ? s.getStaffName() : (s.getStaff() != null ? s.getStaff().getName() : "Staff Member"))
                .build();
    }
}
