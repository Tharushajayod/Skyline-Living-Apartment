package com.skyline.dto.reservation;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationRequest {

    @NotBlank(message = "Apartment ID is required")
    private String apartmentId;

    private BigDecimal reservationFee;

    private String customerName;

    private String customerEmail;

    private String appointmentId;
}
