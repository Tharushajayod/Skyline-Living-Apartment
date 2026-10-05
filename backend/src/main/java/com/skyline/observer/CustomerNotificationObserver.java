package com.skyline.observer;

import com.skyline.service.NotificationService;
import org.springframework.stereotype.Component;

/**
 * Concrete Observer in the Observer Design Pattern.
 * Implements NotificationObserver and delegates notification persistence
 * to the existing NotificationService.
 */
@Component
public class CustomerNotificationObserver implements NotificationObserver {

    private final NotificationService notificationService;

    public CustomerNotificationObserver(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Override
    public void update(NotificationEvent event) {
        if (event == null || event.getRecipient() == null) {
            return;
        }

        notificationService.createNotification(
                event.getRecipient(),
                event.getType(),
                event.getTitle(),
                event.getMessage()
        );
    }
}
