package com.skyline.dto.inquiry;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InquiryReplyRequest {

    @NotBlank(message = "Message cannot be empty")
    private String message;
}
