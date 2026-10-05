package com.skyline.observer;

import com.skyline.entity.User;
import com.skyline.enums.NotificationType;
import lombok.*;

/**
 * Event/data object in the Observer Design Pattern.
 * Encapsulates all data required to create a notification.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EqualsAndHashCode
public class NotificationEvent {

    private User recipient;
    private NotificationType type;
    private String title;
    private String message;

    /**
     * Alias for getRecipient() to support intuitive naming across services.
     *
     * @return the recipient user
     */
    public User getUser() {
        return recipient;
    }
}
