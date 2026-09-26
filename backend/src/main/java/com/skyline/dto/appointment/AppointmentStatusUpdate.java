package com.skyline.dto.appointment;

import com.skyline.enums.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentStatusUpdate {
    private AppointmentStatus status;
    private String date;
    private String timeSlot;
    private String reason;
}
