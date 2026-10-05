package com.skyline.observer;

/**
 * Observer interface in the Observer Design Pattern.
 * Defines the contract for receiving notification updates.
 */
public interface NotificationObserver {

    /**
     * Receives an update when a notification event occurs.
     *
     * @param event the notification event containing details of the notification
     */
    void update(NotificationEvent event);
}
