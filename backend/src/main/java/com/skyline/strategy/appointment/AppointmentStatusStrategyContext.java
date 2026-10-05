package com.skyline.strategy.appointment;

import com.skyline.dto.appointment.AppointmentResponse;
import com.skyline.dto.appointment.AppointmentStatusUpdate;
import com.skyline.entity.Appointment;
import com.skyline.enums.AppointmentStatus;
import com.skyline.exception.BadRequestException;
import com.skyline.security.UserPrincipal;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Strategy Pattern: Context for Appointment Status Transitions.
 * Encapsulates the strategy registry and delegates runtime execution based on the requested target status.
 */
@Component
public class AppointmentStatusStrategyContext {

    // Strategy Pattern: Strategy lookup registry
    private final Map<AppointmentStatus, AppointmentStatusStrategy> strategyMap = new EnumMap<>(AppointmentStatus.class);

    public AppointmentStatusStrategyContext(List<AppointmentStatusStrategy> strategies) {
        for (AppointmentStatusStrategy strategy : strategies) {
            strategyMap.put(strategy.getSupportedStatus(), strategy);
        }
    }

    /**
     * Executes the status transition strategy corresponding to the update's target status.
     */
    public AppointmentResponse executeStrategy(
            Appointment appointment,
            AppointmentStatusUpdate update,
            UserPrincipal principal) {

        if (update == null || update.getStatus() == null) {
            throw new BadRequestException("Status is required for appointment status update");
        }

        AppointmentStatus targetStatus = update.getStatus();
        AppointmentStatusStrategy strategy = strategyMap.get(targetStatus);

        if (strategy == null) {
            throw new BadRequestException("Unsupported status transition: " + targetStatus);
        }

        // Strategy Pattern: polymorphic execution
        return strategy.execute(appointment, update, principal);
    }
}
