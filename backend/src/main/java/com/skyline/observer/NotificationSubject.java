package com.skyline.observer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Subject / Publisher in the Observer Design Pattern.
 * Maintains registered NotificationObserver objects and notifies them
 * when a notification event is published.
 */
@Component
public class NotificationSubject {

    private final List<NotificationObserver> observers = new CopyOnWriteArrayList<>();

    /**
     * Default constructor for testing or manual management.
     */
    public NotificationSubject() {
    }

    /**
     * Spring constructor injection.
     * Automatically registers all NotificationObserver beans found in the Spring application context
     * upon application startup.
     *
     * @param observers all registered NotificationObserver beans in the application context
     */
    @Autowired
    public NotificationSubject(List<NotificationObserver> observers) {
        if (observers != null) {
            this.observers.addAll(observers);
        }
    }

    /**
     * Registers a new observer to receive notification updates.
     *
     * @param observer the observer to register
     */
    public void addObserver(NotificationObserver observer) {
        if (observer != null && !observers.contains(observer)) {
            observers.add(observer);
        }
    }

    /**
     * Unregisters an observer from receiving notification updates.
     *
     * @param observer the observer to remove
     */
    public void removeObserver(NotificationObserver observer) {
        observers.remove(observer);
    }

    /**
     * Notifies all registered observers of a notification event.
     *
     * @param event the notification event to publish
     */
    public void notifyObservers(NotificationEvent event) {
        if (event == null) {
            return;
        }
        for (NotificationObserver observer : observers) {
            observer.update(event);
        }
    }

    /**
     * Returns an unmodifiable view of currently registered observers.
     *
     * @return unmodifiable list of observers
     */
    public List<NotificationObserver> getObservers() {
        return Collections.unmodifiableList(observers);
    }
}
