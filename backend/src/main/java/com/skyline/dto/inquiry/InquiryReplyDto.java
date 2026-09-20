package com.skyline.dto.inquiry;

import com.skyline.entity.InquiryReply;
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
public class InquiryReplyDto {
    private String id;
    private String author;
    private UserRole authorRole;
    private String message;
    private String createdAt;

    public static InquiryReplyDto fromEntity(InquiryReply reply) {
        if (reply == null) return null;
        return InquiryReplyDto.builder()
                .id(IdParser.formatId("REP", reply.getId()))
                .author(reply.getAuthorName() != null ? reply.getAuthorName() : (reply.getAuthor() != null ? reply.getAuthor().getName() : "Staff"))
                .authorRole(reply.getAuthorRole() != null ? reply.getAuthorRole() : (reply.getAuthor() != null ? reply.getAuthor().getRole() : UserRole.STAFF))
                .message(reply.getMessage())
                .createdAt(reply.getCreatedAt() != null ? reply.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : "")
                .build();
    }
}
