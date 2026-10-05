package com.skyline.strategy.appointment;

import com.skyline.dto.appointment.AppointmentResponse;
import com.skyline.dto.appointment.AppointmentStatusUpdate;
import com.skyline.entity.Appointment;
import com.skyline.enums.AppointmentStatus;
import com.skyline.security.UserPrincipal;

/**
 * Strategy Pattern: Strategy Interface for Appointment Status Transitions.
 * Defines the algorithm contract for executing status lifecycle operations.
 */
public interface AppointmentStatusStrategy {

    /**
     * Identifies which AppointmentStatus this strategy handles.
     */
    AppointmentStatus getSupportedStatus();

    /**
     * Executes the status transition with associated validation, persistence, and notifications.
     */
    AppointmentResponse execute(Appointment appointment, AppointmentStatusUpdate update, UserPrincipal principal);
}
