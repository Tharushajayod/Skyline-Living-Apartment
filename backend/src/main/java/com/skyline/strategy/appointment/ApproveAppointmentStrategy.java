package com.skyline.strategy.appointment;

import com.skyline.dto.appointment.AppointmentResponse;
import com.skyline.dto.appointment.AppointmentStatusUpdate;
import com.skyline.entity.Appointment;
import com.skyline.enums.AppointmentStatus;
import com.skyline.enums.NotificationType;
import com.skyline.enums.UserRole;
import com.skyline.exception.ForbiddenException;
import com.skyline.observer.NotificationEvent;
import com.skyline.observer.NotificationSubject;
import com.skyline.repository.AppointmentRepository;
import com.skyline.security.UserPrincipal;
import org.springframework.stereotype.Component;

/**
 * Concrete Strategy: Handles appointment approval by authorized staff or admin.
 */
@Component
public class ApproveAppointmentStrategy implements AppointmentStatusStrategy {

    private final AppointmentRepository appointmentRepository;
    private final NotificationSubject notificationSubject;

    public ApproveAppointmentStrategy(
            AppointmentRepository appointmentRepository,
            NotificationSubject notificationSubject) {
        this.appointmentRepository = appointmentRepository;
        this.notificationSubject = notificationSubject;
    }

    @Override
    public AppointmentStatus getSupportedStatus() {
        return AppointmentStatus.APPROVED;
    }

    @Override
    public AppointmentResponse execute(Appointment appointment, AppointmentStatusUpdate update, UserPrincipal principal) {
        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        if (!isStaffOrAdmin) {
            throw new ForbiddenException("Only staff or administrators can approve viewing appointments.");
        }

        appointment.setStatus(AppointmentStatus.APPROVED);
        Appointment saved = appointmentRepository.save(appointment);

        String title = appointment.getApartment() != null ? appointment.getApartment().getTitle() : "Apartment";
        notificationSubject.notifyObservers(new NotificationEvent(
                appointment.getCustomer(),
                NotificationType.APPOINTMENT,
                "Viewing Status: Approved",
                "Your viewing for " + title + " has been approved for " + appointment.getDate() + " (" + appointment.getTimeSlot() + ")."
        ));

        return AppointmentResponse.fromEntity(saved);
    }
}
