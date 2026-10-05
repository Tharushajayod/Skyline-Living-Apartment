package com.skyline.service;

import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Sale;
import com.skyline.enums.ReservationStatus;
import com.skyline.enums.UserRole;
import com.skyline.exception.ConflictException;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.ReservationRepository;
import com.skyline.repository.SaleRepository;
import com.skyline.security.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class ApartmentAvailabilityService {

    private final ApartmentRepository apartmentRepository;
    private final ReservationRepository reservationRepository;
    private final SaleRepository saleRepository;

    public ApartmentAvailabilityService(
            ApartmentRepository apartmentRepository,
            ReservationRepository reservationRepository,
            SaleRepository saleRepository) {
        this.apartmentRepository = apartmentRepository;
        this.reservationRepository = reservationRepository;
        this.saleRepository = saleRepository;
    }

    /**
     * Authoritatively transition apartment to RESERVED.
     */
    @Transactional
    public void markReserved(Apartment apartment) {
        if (apartment == null) {
            return;
        }
        if (isApartmentSold(apartment.getId()) || apartment.getStatus() == ApartmentStatus.SOLD) {
            throw new ConflictException("Apartment is already sold and cannot be reserved.");
        }
        apartment.setStatus(ApartmentStatus.RESERVED);
        apartmentRepository.save(apartment);
    }

    /**
     * Authoritatively transition apartment to SOLD.
     * SOLD status is final and takes precedence over all other statuses.
     */
    @Transactional
    public void markSold(Apartment apartment) {
        if (apartment == null) {
            return;
        }
        apartment.setStatus(ApartmentStatus.SOLD);
        apartmentRepository.save(apartment);
    }

    /**
     * Centralized availability recalculation after reservation cancellation, expiration, or rejection.
     * Guaranteed rule: A SOLD apartment can NEVER revert to AVAILABLE or RESERVED.
     */
    @Transactional
    public void updateApartmentAvailabilityAfterReservationChange(Long apartmentId) {
        if (apartmentId == null) {
            return;
        }

        Apartment apt = apartmentRepository.findById(apartmentId).orElse(null);
        if (apt == null) {
            return;
        }

        // 1. If apartment is already marked SOLD or an official Sale deed exists, NEVER revert to AVAILABLE
        if (apt.getStatus() == ApartmentStatus.SOLD || (saleRepository != null && saleRepository.findByApartmentId(apartmentId).isPresent())) {
            if (apt.getStatus() != ApartmentStatus.SOLD) {
                apt.setStatus(ApartmentStatus.SOLD);
                apartmentRepository.save(apt);
            }
            return;
        }

        // 2. Check if other active blocking reservations (PENDING or CONFIRMED) exist
        boolean hasActive = reservationRepository != null && reservationRepository.existsByApartmentIdAndStatusIn(
                apartmentId,
                Arrays.asList(ReservationStatus.PENDING, ReservationStatus.CONFIRMED)
        );

        if (!hasActive) {
            apt.setStatus(ApartmentStatus.AVAILABLE);
            apartmentRepository.save(apt);
        } else {
            apt.setStatus(ApartmentStatus.RESERVED);
            apartmentRepository.save(apt);
        }
    }

    /**
     * Check whether an apartment is sold based on status and authoritative sale records.
     */
    public boolean isApartmentSold(Long apartmentId) {
        if (apartmentId == null) {
            return false;
        }
        if (saleRepository != null && saleRepository.findByApartmentId(apartmentId).isPresent()) {
            return true;
        }
        return apartmentRepository.findById(apartmentId)
                .map(a -> a.getStatus() == ApartmentStatus.SOLD)
                .orElse(false);
    }

    /**
     * Evaluates whether a user/principal has authorization to view or access an apartment.
     *
     * Rules:
     * - Unsold apartments (AVAILABLE, RESERVED) are visible to all users.
     * - SOLD apartments are hidden from anonymous users.
     * - SOLD apartments are hidden from customers who do not own them.
     * - The buyer/owner of a SOLD apartment CAN access their apartment details.
     * - Staff and Admins CAN access all apartments including SOLD.
     */
    public boolean canCustomerAccessApartment(Apartment apartment, UserPrincipal principal) {
        if (apartment == null) {
            return false;
        }

        boolean sold = apartment.getStatus() == ApartmentStatus.SOLD ||
                (saleRepository != null && saleRepository.findByApartmentId(apartment.getId()).isPresent());

        // Unsold apartments are publicly accessible
        if (!sold) {
            return true;
        }

        // Anonymous user cannot access sold apartment
        if (principal == null || principal.getUser() == null) {
            return false;
        }

        // Management can always access sold apartments
        UserRole role = principal.getUser().getRole();
        if (role == UserRole.STAFF || role == UserRole.ADMIN) {
            return true;
        }

        // Customer can only access if they are the verified buyer/owner of this apartment
        if (role == UserRole.CUSTOMER && saleRepository != null) {
            Optional<Sale> saleOpt = saleRepository.findByApartmentId(apartment.getId());
            if (saleOpt.isPresent()) {
                Sale sale = saleOpt.get();
                boolean matchesId = sale.getCustomer() != null && sale.getCustomer().getId().equals(principal.getId());
                boolean matchesEmail = sale.getCustomerEmail() != null &&
                        sale.getCustomerEmail().equalsIgnoreCase(principal.getUser().getEmail());
                return matchesId || matchesEmail;
            }
        }

        return false;
    }

    /**
     * Safe non-destructive startup reconciliation:
     * Audits existing database records and corrects inconsistencies without deleting historical data.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void reconcileAllApartmentStatuses() {
        if (saleRepository == null || reservationRepository == null) {
            return;
        }
        try {
            List<Apartment> apartments = apartmentRepository.findAll();
            int currentYear = Year.now().getValue();

            for (Apartment apt : apartments) {
                boolean changed = false;

                // 1. If sale exists, status MUST be SOLD
                if (saleRepository.findByApartmentId(apt.getId()).isPresent()) {
                    if (apt.getStatus() != ApartmentStatus.SOLD) {
                        apt.setStatus(ApartmentStatus.SOLD);
                        changed = true;
                    }
                } else {
                    // 2. Unsold: check if active reservation exists
                    boolean hasActive = reservationRepository.existsByApartmentIdAndStatusIn(
                            apt.getId(),
                            Arrays.asList(ReservationStatus.PENDING, ReservationStatus.CONFIRMED)
                    );
                    if (hasActive && apt.getStatus() != ApartmentStatus.RESERVED) {
                        apt.setStatus(ApartmentStatus.RESERVED);
                        changed = true;
                    } else if (!hasActive && apt.getStatus() == ApartmentStatus.RESERVED) {
                        apt.setStatus(ApartmentStatus.AVAILABLE);
                        changed = true;
                    }
                }

                // 3. Safe numeric bounds correction
                if (apt.getFloor() != null && apt.getFloor() < 0) {
                    apt.setFloor(0);
                    changed = true;
                }
                if (apt.getBedrooms() != null && apt.getBedrooms() < 1) {
                    apt.setBedrooms(1);
                    changed = true;
                }
                if (apt.getBathrooms() != null && apt.getBathrooms() < 1) {
                    apt.setBathrooms(1);
                    changed = true;
                }
                if (apt.getSize() != null && apt.getSize() <= 0) {
                    apt.setSize(50.0);
                    changed = true;
                }
                if (apt.getYearBuilt() != null) {
                    if (apt.getYearBuilt() < 1980) {
                        apt.setYearBuilt(2024);
                        changed = true;
                    } else if (apt.getYearBuilt() > currentYear) {
                        apt.setYearBuilt(currentYear);
                        changed = true;
                    }
                }

                if (changed) {
                    apartmentRepository.save(apt);
                    log.info("Reconciled apartment #{} ({}) safely", apt.getApartmentNumber(), apt.getId());
                }
            }
        } catch (Exception e) {
            log.warn("Apartment status reconciliation deferred or skipped: {}", e.getMessage());
        }
    }
}
