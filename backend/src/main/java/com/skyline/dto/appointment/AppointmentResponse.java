package com.skyline.dto.appointment;

import com.skyline.entity.Appointment;
import com.skyline.enums.AppointmentStatus;
import com.skyline.util.IdParser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.format.DateTimeFormatter;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {
    private String id;
    private String apartmentId;
    private String apartmentTitle;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String date;
    private String timeSlot;
    private AppointmentStatus status;
    private String notes;
    private String createdAt;

    public static AppointmentResponse fromEntity(Appointment a) {
        if (a == null) return null;
        return AppointmentResponse.builder()
                .id(IdParser.formatId("APT-AP", a.getId()))
                .apartmentId(a.getApartment() != null ? IdParser.formatId("APT", a.getApartment().getId()) : "")
                .apartmentTitle(a.getApartment() != null ? a.getApartment().getTitle() : "")
                .customerName(a.getCustomerName() != null ? a.getCustomerName() : (a.getCustomer() != null ? a.getCustomer().getName() : ""))
                .customerEmail(a.getCustomerEmail() != null ? a.getCustomerEmail() : (a.getCustomer() != null ? a.getCustomer().getEmail() : ""))
                .customerPhone(a.getCustomerPhone() != null ? a.getCustomerPhone() : (a.getCustomer() != null ? a.getCustomer().getPhone() : ""))
                .date(a.getDate() != null ? a.getDate().toString() : "")
                .timeSlot(a.getTimeSlot())
                .status(a.getStatus())
                .notes(a.getNotes() != null ? a.getNotes() : "")
                .createdAt(a.getCreatedAt() != null ? a.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : "")
                .build();
    }
}
