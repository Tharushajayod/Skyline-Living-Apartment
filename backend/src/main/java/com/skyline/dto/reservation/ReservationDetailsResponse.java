package com.skyline.dto.reservation;

import com.skyline.dto.apartment.ApartmentResponse;
import com.skyline.dto.appointment.AppointmentResponse;
import com.skyline.dto.payment.PaymentResponse;
import com.skyline.dto.user.UserDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationDetailsResponse {

    private ReservationResponse reservation;
    private UserDto customer;
    private ApartmentResponse apartment;
    private AppointmentResponse appointment;
    private PaymentResponse payment;
    private List<PaymentResponse> allPayments;
    private ReservationRefundResponse refund;
}
