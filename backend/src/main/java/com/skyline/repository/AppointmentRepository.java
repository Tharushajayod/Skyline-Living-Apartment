package com.skyline.repository;

import com.skyline.entity.Appointment;
import com.skyline.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByCustomerIdOrderByDateDesc(Long customerId);

    List<Appointment> findByCustomerEmailOrderByDateDesc(String customerEmail);

    List<Appointment> findByApartmentId(Long apartmentId);

    List<Appointment> findByStatus(AppointmentStatus status);

    long countByStatus(AppointmentStatus status);

    boolean existsByApartmentIdAndCustomerIdAndStatusIn(Long apartmentId, Long customerId, Collection<AppointmentStatus> statuses);

    boolean existsByApartmentIdAndDateAndTimeSlotAndStatusIn(Long apartmentId, java.time.LocalDate date, String timeSlot, Collection<AppointmentStatus> statuses);

    java.util.Optional<Appointment> findFirstByApartmentIdAndCustomerIdAndStatusOrderByDateDesc(Long apartmentId, Long customerId, AppointmentStatus status);

    @org.springframework.data.jpa.repository.Query("""
        SELECT DISTINCT a FROM Appointment a
        LEFT JOIN FETCH a.apartment
        LEFT JOIN FETCH a.customer
        ORDER BY a.date DESC, a.createdAt DESC
    """)
    List<Appointment> findAllWithDetails();

    @org.springframework.data.jpa.repository.Query("""
        SELECT DISTINCT a FROM Appointment a
        LEFT JOIN FETCH a.apartment
        LEFT JOIN FETCH a.customer
        WHERE a.customer.id = :customerId
        ORDER BY a.date DESC, a.createdAt DESC
    """)
    List<Appointment> findByCustomerIdWithDetails(@org.springframework.data.repository.query.Param("customerId") Long customerId);
}
