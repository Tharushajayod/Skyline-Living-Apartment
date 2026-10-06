package com.skyline.strategy.payment;

import com.skyline.entity.Payment;
import com.skyline.entity.Reservation;
import com.skyline.enums.PaymentType;
import com.skyline.enums.ReservationStatus;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.PaymentRepository;
import com.skyline.repository.ReservationRepository;
import com.skyline.repository.SaleRepository;
import com.skyline.security.UserPrincipal;
import org.springframework.stereotype.Component;

/**
 * Strategy Pattern: Concrete Strategy for verifying reservation fee payments.
 * Confirms the pending reservation and checks apartment status.
 */
@Component
public class ReservationFeeVerificationStrategy extends AbstractPaymentVerificationStrategy {

    private final ReservationRepository reservationRepository;

    public ReservationFeeVerificationStrategy(
            ApartmentRepository apartmentRepository,
            PaymentRepository paymentRepository,
            SaleRepository saleRepository,
            ReservationRepository reservationRepository) {
        super(apartmentRepository, paymentRepository, saleRepository);
        this.reservationRepository = reservationRepository;
    }

    @Override
    public boolean supports(PaymentType paymentType) {
        return paymentType == PaymentType.RESERVATION_FEE;
    }

    @Override
    public void executePostVerification(Payment payment, UserPrincipal principal, String verifierName) {
        // Confirm associated reservation
        if (payment.getReservation() != null) {
            Reservation reservation = payment.getReservation();
            java.time.LocalDateTime confirmedAt = payment.getVerifiedAt() != null
                    ? payment.getVerifiedAt()
                    : java.time.LocalDateTime.now();

            // Authoritative fee confirmation: set exactly once (idempotent)
            if (reservation.getReservationFeeConfirmedAt() == null) {
                reservation.setReservationFeeConfirmedAt(confirmedAt);
                reservation.setExpiresAt(confirmedAt.plusDays(4));
                reservation.setCancellationDeadline(confirmedAt.plusHours(48));
            }
            reservation.setStatus(ReservationStatus.CONFIRMED);
            reservationRepository.save(reservation);
        }

        // Check if apartment balance reached zero
        checkAndMarkApartmentSold(payment, principal, verifierName);
    }
}
