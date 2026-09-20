package com.skyline.dto.appointment;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentRequest {

    @NotBlank(message = "Apartment ID is required")
    private String apartmentId;

    private String apartmentTitle;

    private String customerName;

    private String customerEmail;

    private String customerPhone;

    @NotBlank(message = "Viewing date is required")
    private String date;

    @NotBlank(message = "Time slot is required")
    private String timeSlot;

    private String notes;
}
