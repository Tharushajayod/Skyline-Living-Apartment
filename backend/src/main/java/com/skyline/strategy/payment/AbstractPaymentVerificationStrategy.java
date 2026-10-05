package com.skyline.strategy.payment;

import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Payment;
import com.skyline.entity.Sale;
import com.skyline.entity.User;
import com.skyline.enums.PaymentStatus;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.PaymentRepository;
import com.skyline.repository.SaleRepository;
import com.skyline.security.UserPrincipal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Strategy Pattern: Common Base Strategy containing shared helper logic
 * for balance verification and apartment ownership transfer.
 */
public abstract class AbstractPaymentVerificationStrategy implements PaymentVerificationStrategy {

    protected final ApartmentRepository apartmentRepository;
    protected final PaymentRepository paymentRepository;
    protected final SaleRepository saleRepository;

    public AbstractPaymentVerificationStrategy(
            ApartmentRepository apartmentRepository,
            PaymentRepository paymentRepository,
            SaleRepository saleRepository) {
        this.apartmentRepository = apartmentRepository;
        this.paymentRepository = paymentRepository;
        this.saleRepository = saleRepository;
    }

    /**
     * Calculates the sum of all verified payments for the given apartment.
     */
    protected BigDecimal getVerifiedApartmentTotal(Long apartmentId) {
        if (apartmentId == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal total = paymentRepository.sumAmountByApartmentAndStatus(apartmentId, PaymentStatus.VERIFIED);
        return total != null ? total : BigDecimal.ZERO;
    }

    /**
     * Checks if all required payments for the apartment have been settled,
     * and transitions status to SOLD while creating a Sale record if needed.
     */
    protected void checkAndMarkApartmentSold(Payment payment, UserPrincipal principal, String verifierName) {
        Apartment apartment = payment.getApartment();
        if (apartment == null) {
            return;
        }

        BigDecimal totalVerified = getVerifiedApartmentTotal(apartment.getId());
        BigDecimal remaining = apartment.getPrice() != null
                ? apartment.getPrice().subtract(totalVerified)
                : BigDecimal.ZERO;

        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            markApartmentSold(apartment, payment, principal, verifierName);
        }
    }

    /**
     * Marks an apartment as SOLD and records the official Sale deed transfer.
     */
    protected void markApartmentSold(Apartment apartment, Payment payment, UserPrincipal principal, String verifierName) {
        apartment.setStatus(ApartmentStatus.SOLD);
        apartmentRepository.save(apartment);

        if (saleRepository.findByApartmentId(apartment.getId()).isEmpty()) {
            User customer = payment.getCustomer();
            if (customer == null && payment.getReservation() != null) {
                customer = payment.getReservation().getCustomer();
            }

            Sale sale = Sale.builder()
                    .apartment(apartment)
                    .customer(customer)
                    .customerName(customer != null ? customer.getName() : "Customer")
                    .customerEmail(customer != null ? customer.getEmail() : "")
                    .apartmentTitle(apartment.getTitle())
                    .finalPrice(apartment.getPrice())
                    .reservation(payment.getReservation())
                    .saleDate(LocalDate.now())
                    .ownershipDate(LocalDate.now())
                    .ownershipStatus("Deed Transferred")
                    .staff(principal != null ? principal.getUser() : null)
                    .staffName(verifierName)
                    .createdAt(LocalDateTime.now())
                    .build();

            saleRepository.save(sale);
        }
    }
}
