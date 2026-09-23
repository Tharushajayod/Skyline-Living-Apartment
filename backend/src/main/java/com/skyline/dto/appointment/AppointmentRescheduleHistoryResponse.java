package com.skyline.dto.appointment;

import com.skyline.entity.AppointmentRescheduleHistory;
import com.skyline.enums.UserRole;
import com.skyline.util.IdParser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.format.DateTimeFormatter;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentRescheduleHistoryResponse {

    private String id;
    private String appointmentId;
    private String oldDate;
    private String oldTimeSlot;
    private String newDate;
    private String newTimeSlot;
    private String reason;
    private String changedBy;
    private UserRole changedByRole;
    private String createdAt;

    public static AppointmentRescheduleHistoryResponse fromEntity(AppointmentRescheduleHistory h) {
        if (h == null) return null;
        return AppointmentRescheduleHistoryResponse.builder()
                .id(IdParser.formatId("ARH", h.getId()))
                .appointmentId(h.getAppointment() != null ? IdParser.formatId("APT-AP", h.getAppointment().getId()) : "")
                .oldDate(h.getOldDate() != null ? h.getOldDate().toString() : "")
                .oldTimeSlot(h.getOldTimeSlot())
                .newDate(h.getNewDate() != null ? h.getNewDate().toString() : "")
                .newTimeSlot(h.getNewTimeSlot())
                .reason(h.getReason())
                .changedBy(h.getChangedBy())
                .changedByRole(h.getChangedByRole())
                .createdAt(h.getCreatedAt() != null ? h.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : "")
                .build();
    }
}
