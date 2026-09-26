package com.skyline.repository;

import com.skyline.entity.AppointmentRescheduleHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRescheduleHistoryRepository extends JpaRepository<AppointmentRescheduleHistory, Long> {

    List<AppointmentRescheduleHistory> findByAppointmentIdOrderByCreatedAtDesc(Long appointmentId);
}
