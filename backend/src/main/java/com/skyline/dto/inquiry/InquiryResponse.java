package com.skyline.dto.inquiry;

import com.skyline.entity.Inquiry;
import com.skyline.enums.InquiryCategory;
import com.skyline.enums.InquiryPriority;
import com.skyline.enums.InquiryStatus;
import com.skyline.util.IdParser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InquiryResponse {
    private String id;
    private String apartmentId;
    private String apartmentTitle;
    private String customerName;
    private String customerEmail;
    private String subject;
    private String message;
    private InquiryCategory category;
    private InquiryPriority priority;
    private InquiryStatus status;
    private List<InquiryReplyDto> replies;
    private String createdAt;

    public static InquiryResponse fromEntity(Inquiry inq) {
        if (inq == null) return null;

        List<InquiryReplyDto> replyDtos = new ArrayList<>();
        if (inq.getReplies() != null) {
            replyDtos = inq.getReplies().stream()
                    .map(InquiryReplyDto::fromEntity)
                    .collect(Collectors.toList());
        }

        return InquiryResponse.builder()
                .id(IdParser.formatId("INQ", inq.getId()))
                .apartmentId(inq.getApartment() != null ? IdParser.formatId("APT", inq.getApartment().getId()) : null)
                .apartmentTitle(inq.getApartmentTitle() != null ? inq.getApartmentTitle() : (inq.getApartment() != null ? inq.getApartment().getTitle() : null))
                .customerName(inq.getCustomerName() != null ? inq.getCustomerName() : (inq.getCustomer() != null ? inq.getCustomer().getName() : ""))
                .customerEmail(inq.getCustomerEmail() != null ? inq.getCustomerEmail() : (inq.getCustomer() != null ? inq.getCustomer().getEmail() : ""))
                .subject(inq.getSubject())
                .message(inq.getMessage())
                .category(inq.getCategory())
                .priority(inq.getPriority())
                .status(inq.getStatus())
                .replies(replyDtos)
                .createdAt(inq.getCreatedAt() != null ? inq.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : "")
                .build();
    }
}
