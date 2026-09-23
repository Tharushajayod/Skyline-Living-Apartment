package com.skyline.dto.appointment;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleProposalRequest {

    @NotBlank(message = "Proposed date is required")
    private String date;

    @NotBlank(message = "Proposed time slot is required")
    private String timeSlot;

    @NotBlank(message = "Reason for reschedule is required")
    private String reason;
}
