package com.skyline.decorator.sale;

import com.skyline.dto.apartment.ApartmentResponse;
import com.skyline.dto.reservation.ReservationResponse;
import com.skyline.dto.sale.SaleDetailsResponse;
import com.skyline.dto.sale.SaleResponse;
import com.skyline.dto.user.UserDto;
import com.skyline.entity.Apartment;
import com.skyline.entity.Reservation;
import com.skyline.entity.Sale;
import com.skyline.entity.User;

/**
 * Decorator Pattern: Concrete Component.
 *
 * Provides the fundamental sale statement containing core sale entity information,
 * purchaser profile, apartment specifications, and associated reservation details.
 */
public class BasicSaleStatement implements SaleStatementComponent {

    private final Sale sale;

    public BasicSaleStatement(Sale sale) {
        this.sale = sale;
    }

    @Override
    public SaleDetailsResponse generateStatement() {
        if (sale == null) {
            return SaleDetailsResponse.builder().build();
        }

        SaleResponse saleResponse = SaleResponse.fromEntity(sale);

        // Customer details
        User customer = sale.getCustomer();
        UserDto customerDto = customer != null ? UserDto.fromEntity(customer) : null;

        // Apartment details
        Apartment apartment = sale.getApartment();
        ApartmentResponse apartmentResponse = apartment != null ? ApartmentResponse.fromEntity(apartment) : null;

        // Reservation details
        Reservation reservation = sale.getReservation();
        ReservationResponse reservationResponse = reservation != null ? ReservationResponse.fromEntity(reservation) : null;

        return SaleDetailsResponse.builder()
                .sale(saleResponse)
                .customer(customerDto)
                .apartment(apartmentResponse)
                .reservation(reservationResponse)
                .build();
    }
}
