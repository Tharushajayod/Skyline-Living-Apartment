package com.skyline.strategy.appointment;

import com.skyline.dto.appointment.AppointmentResponse;
import com.skyline.dto.appointment.AppointmentStatusUpdate;
import com.skyline.entity.Appointment;
import com.skyline.enums.AppointmentStatus;
import com.skyline.enums.NotificationType;
import com.skyline.enums.RescheduleStatus;
import com.skyline.enums.UserRole;
import com.skyline.exception.BadRequestException;
import com.skyline.exception.ForbiddenException;
import com.skyline.observer.NotificationEvent;
import com.skyline.observer.NotificationSubject;
import com.skyline.repository.AppointmentRepository;
import com.skyline.security.UserPrincipal;
import org.springframework.stereotype.Component;

/**
 * Concrete Strategy: Handles marking an appointment as COMPLETED, unlocking reservation eligibility.
 */
@Component
public class CompleteAppointmentStrategy implements AppointmentStatusStrategy {

    private final AppointmentRepository appointmentRepository;
    private final NotificationSubject notificationSubject;

    public CompleteAppointmentStrategy(
            AppointmentRepository appointmentRepository,
            NotificationSubject notificationSubject) {
        this.appointmentRepository = appointmentRepository;
        this.notificationSubject = notificationSubject;
    }

    @Override
    public AppointmentStatus getSupportedStatus() {
        return AppointmentStatus.COMPLETED;
    }

    @Override
    public AppointmentResponse execute(Appointment appointment, AppointmentStatusUpdate update, UserPrincipal principal) {
        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        if (!isStaffOrAdmin) {
            throw new ForbiddenException("Only authorized staff or administrators can mark an appointment as completed.");
        }

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            return AppointmentResponse.fromEntity(appointment);
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED || appointment.getStatus() == AppointmentStatus.REJECTED) {
            throw new BadRequestException("Cannot complete a cancelled or declined appointment.");
        }

        if (appointment.getRescheduleStatus() != RescheduleStatus.NONE) {
            throw new BadRequestException("Cannot complete an appointment with a pending reschedule request. Please resolve the reschedule first.");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        Appointment saved = appointmentRepository.save(appointment);

        String title = appointment.getApartment() != null ? appointment.getApartment().getTitle() : "Apartment";
        notificationSubject.notifyObservers(new NotificationEvent(
                appointment.getCustomer(),
                NotificationType.APPOINTMENT,
                "Viewing Status: Completed",
                "Viewing completed! You are now eligible to place a reservation on " + title + "."
        ));

        return AppointmentResponse.fromEntity(saved);
    }
}
