package com.skyline.strategy.appointment;

import com.skyline.dto.appointment.AppointmentResponse;
import com.skyline.dto.appointment.AppointmentStatusUpdate;
import com.skyline.entity.Appointment;
import com.skyline.enums.AppointmentStatus;
import com.skyline.enums.NotificationType;
import com.skyline.enums.RescheduleStatus;
import com.skyline.enums.UserRole;
import com.skyline.exception.BadRequestException;
import com.skyline.exception.ConflictException;
import com.skyline.exception.ForbiddenException;
import com.skyline.observer.NotificationEvent;
import com.skyline.observer.NotificationSubject;
import com.skyline.repository.AppointmentRepository;
import com.skyline.security.UserPrincipal;
import com.skyline.service.AppointmentService;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;

/**
 * Concrete Strategy: Handles appointment reschedule proposal transitions.
 */
@Component
public class RescheduleAppointmentStrategy implements AppointmentStatusStrategy {

    private final AppointmentRepository appointmentRepository;
    private final NotificationSubject notificationSubject;

    public RescheduleAppointmentStrategy(
            AppointmentRepository appointmentRepository,
            NotificationSubject notificationSubject) {
        this.appointmentRepository = appointmentRepository;
        this.notificationSubject = notificationSubject;
    }

    @Override
    public AppointmentStatus getSupportedStatus() {
        return AppointmentStatus.RESCHEDULED;
    }

    @Override
    public AppointmentResponse execute(Appointment appointment, AppointmentStatusUpdate update, UserPrincipal principal) {
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Completed appointments cannot be rescheduled.");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED || appointment.getStatus() == AppointmentStatus.REJECTED) {
            throw new BadRequestException("Cancelled or declined appointments cannot be rescheduled.");
        }

        String reason = update.getReason() != null ? update.getReason().trim() : "Schedule change request";
        String dateStr = update.getDate() != null ? update.getDate().trim() : (appointment.getDate() != null ? appointment.getDate().toString() : "");
        String timeSlot = update.getTimeSlot() != null ? update.getTimeSlot().trim() : (appointment.getTimeSlot() != null ? appointment.getTimeSlot() : "");

        LocalDate newDate;
        try {
            newDate = LocalDate.parse(dateStr);
        } catch (Exception e) {
            throw new BadRequestException("Invalid reschedule date format. Expected YYYY-MM-DD");
        }

        if (timeSlot.isEmpty()) {
            throw new BadRequestException("Time slot is required for reschedule proposal.");
        }

        AppointmentService.validateFutureDateTime(newDate, timeSlot);

        boolean slotTaken = appointmentRepository.existsByApartmentIdAndDateAndTimeSlotAndStatusIn(
                appointment.getApartment().getId(),
                newDate,
                timeSlot,
                Arrays.asList(AppointmentStatus.PENDING, AppointmentStatus.APPROVED)
        );
        if (slotTaken && (!newDate.equals(appointment.getDate()) || !timeSlot.equalsIgnoreCase(appointment.getTimeSlot()))) {
            throw new ConflictException("The time slot " + timeSlot + " on " + newDate + " is already booked for this apartment.");
        }

        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        if (!isStaffOrAdmin) {
            if (principal == null || !appointment.getCustomer().getId().equals(principal.getId())) {
                throw new ForbiddenException("You can only propose reschedules for your own appointments.");
            }
            appointment.setRescheduleStatus(RescheduleStatus.PENDING_ADMIN);
            appointment.setRescheduleRequestedBy(principal.getUser().getName());
            appointment.setRescheduleRequestedByRole(UserRole.CUSTOMER);
        } else {
            appointment.setRescheduleStatus(RescheduleStatus.PENDING_CUSTOMER);
            appointment.setRescheduleRequestedBy(principal != null ? principal.getUser().getName() : "Skyline Concierge");
            appointment.setRescheduleRequestedByRole(principal != null ? principal.getUser().getRole() : UserRole.STAFF);

            notificationSubject.notifyObservers(new NotificationEvent(
                    appointment.getCustomer(),
                    NotificationType.APPOINTMENT,
                    "Viewing Reschedule Proposed",
                    "Skyline team has proposed a new viewing time for " + appointment.getApartment().getTitle() + ": "
                            + newDate + " at " + timeSlot + ". Reason: " + reason + ". Please review and respond in your appointments."
            ));
        }

        appointment.setProposedDate(newDate);
        appointment.setProposedTimeSlot(timeSlot);
        appointment.setRescheduleReason(reason);
        appointment.setRescheduleRequestedAt(LocalDateTime.now());

        Appointment saved = appointmentRepository.save(appointment);
        return AppointmentResponse.fromEntity(saved);
    }
}
