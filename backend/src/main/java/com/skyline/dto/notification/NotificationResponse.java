package com.skyline.dto.notification;

import com.skyline.entity.Notification;
import com.skyline.enums.NotificationType;
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
public class NotificationResponse {
    private String id;
    private NotificationType type;
    private String title;
    private String message;
    private boolean read;
    private String createdAt;

    public static NotificationResponse fromEntity(Notification n) {
        if (n == null) return null;
        return NotificationResponse.builder()
                .id(IdParser.formatId("NOT", n.getId()))
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .read(n.isRead())
                .createdAt(n.getCreatedAt() != null ? n.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : "")
                .build();
    }
}
