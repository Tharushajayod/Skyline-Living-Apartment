package com.skyline.dto.inquiry;

import com.skyline.enums.InquiryCategory;
import com.skyline.enums.InquiryPriority;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InquiryRequest {

    private String apartmentId;
    private String apartmentTitle;
    private String customerName;
    private String customerEmail;

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Message is required")
    private String message;

    private InquiryCategory category;
    private InquiryPriority priority;
}
