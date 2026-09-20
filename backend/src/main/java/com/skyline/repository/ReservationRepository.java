package com.skyline.repository;

import com.skyline.entity.Reservation;
import com.skyline.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Reservation> findByCustomerEmailOrderByCreatedAtDesc(String customerEmail);

    List<Reservation> findByApartmentId(Long apartmentId);

    List<Reservation> findByStatus(ReservationStatus status);

    boolean existsByApartmentIdAndStatusIn(Long apartmentId, Collection<ReservationStatus> statuses);

    List<Reservation> findByStatusAndExpiresAtBefore(ReservationStatus status, LocalDateTime dateTime);

    long countByStatus(ReservationStatus status);

    long countByStatusIn(Collection<ReservationStatus> statuses);
}
