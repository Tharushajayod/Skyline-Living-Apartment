package com.skyline.dto.reservation;

import com.skyline.entity.Reservation;
import com.skyline.enums.ReservationStatus;
import com.skyline.util.IdParser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponse {
    private String id;
    private String apartmentId;
    private String appointmentId;
    private String apartmentTitle;
    private String customerName;
    private String customerEmail;
    private BigDecimal reservationFee;
    private ReservationStatus status;
    private String expiresAt;
    private String createdAt;

    private boolean hasPaymentCommitment;
    private String paymentCommitmentReason;

    public static ReservationResponse fromEntity(Reservation r) {
        return fromEntity(r, false, null);
    }

    public static ReservationResponse fromEntity(Reservation r, boolean hasPaymentCommitment, String paymentCommitmentReason) {
        if (r == null) return null;
        return ReservationResponse.builder()
                .id(IdParser.formatId("RSV", r.getId()))
                .apartmentId(r.getApartment() != null ? IdParser.formatId("APT", r.getApartment().getId()) : "")
                .appointmentId(r.getAppointment() != null ? IdParser.formatId("APT-AP", r.getAppointment().getId()) : "")
                .apartmentTitle(r.getApartment() != null ? r.getApartment().getTitle() : "")
                .customerName(r.getCustomerName() != null ? r.getCustomerName() : (r.getCustomer() != null ? r.getCustomer().getName() : ""))
                .customerEmail(r.getCustomerEmail() != null ? r.getCustomerEmail() : (r.getCustomer() != null ? r.getCustomer().getEmail() : ""))
                .reservationFee(r.getReservationFee())
                .status(r.getStatus())
                .expiresAt(r.getExpiresAt() != null ? r.getExpiresAt().format(DateTimeFormatter.ISO_DATE_TIME) : "")
                .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : "")
                .hasPaymentCommitment(hasPaymentCommitment)
                .paymentCommitmentReason(paymentCommitmentReason)
                .build();
    }
}
