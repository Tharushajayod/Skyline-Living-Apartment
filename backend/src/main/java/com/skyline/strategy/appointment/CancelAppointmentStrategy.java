package com.skyline.strategy.appointment;

import com.skyline.dto.appointment.AppointmentResponse;
import com.skyline.dto.appointment.AppointmentStatusUpdate;
import com.skyline.entity.Appointment;
import com.skyline.enums.AppointmentStatus;
import com.skyline.enums.NotificationType;
import com.skyline.enums.RescheduleStatus;
import com.skyline.enums.UserRole;
import com.skyline.exception.ForbiddenException;
import com.skyline.observer.NotificationEvent;
import com.skyline.observer.NotificationSubject;
import com.skyline.repository.AppointmentRepository;
import com.skyline.security.UserPrincipal;
import org.springframework.stereotype.Component;

/**
 * Concrete Strategy: Handles appointment cancellation by customer or management.
 */
@Component
public class CancelAppointmentStrategy implements AppointmentStatusStrategy {

    private final AppointmentRepository appointmentRepository;
    private final NotificationSubject notificationSubject;

    public CancelAppointmentStrategy(
            AppointmentRepository appointmentRepository,
            NotificationSubject notificationSubject) {
        this.appointmentRepository = appointmentRepository;
        this.notificationSubject = notificationSubject;
    }

    @Override
    public AppointmentStatus getSupportedStatus() {
        return AppointmentStatus.CANCELLED;
    }

    @Override
    public AppointmentResponse execute(Appointment appointment, AppointmentStatusUpdate update, UserPrincipal principal) {
        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        if (!isStaffOrAdmin) {
            if (principal == null || appointment.getCustomer() == null ||
                    !appointment.getCustomer().getId().equals(principal.getId())) {
                throw new ForbiddenException("You cannot modify another customer's appointment");
            }
        }

        // Clear pending reschedule proposal if any
        appointment.setRescheduleStatus(RescheduleStatus.NONE);
        appointment.setProposedDate(null);
        appointment.setProposedTimeSlot(null);
        appointment.setRescheduleReason(null);

        appointment.setStatus(AppointmentStatus.CANCELLED);
        Appointment saved = appointmentRepository.save(appointment);

        String title = appointment.getApartment() != null ? appointment.getApartment().getTitle() : "Apartment";
        notificationSubject.notifyObservers(new NotificationEvent(
                appointment.getCustomer(),
                NotificationType.APPOINTMENT,
                "Viewing Status: Cancelled",
                "Your viewing appointment for " + title + " has been cancelled."
        ));

        return AppointmentResponse.fromEntity(saved);
    }
}
