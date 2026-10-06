package com.skyline.observer;

import com.skyline.entity.User;
import com.skyline.enums.NotificationType;
import com.skyline.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
    
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ObserverPatternTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private NotificationObserver mockObserver1;

    @Mock
    private NotificationObserver mockObserver2;

    private CustomerNotificationObserver customerNotificationObserver;
    private NotificationSubject notificationSubject;
    private User testCustomer;

    @BeforeEach
    void setUp() {
        customerNotificationObserver = new CustomerNotificationObserver(notificationService);
        notificationSubject = new NotificationSubject();

        testCustomer = User.builder()
                .id(1L)
                .name("Sarah Chen")
                .email("sarah.chen@email.com")
                .build();
    }

    @Test
    @DisplayName("Should successfully add and retrieve observers in NotificationSubject")
    void testAddObserver() {
        notificationSubject.addObserver(mockObserver1);
        notificationSubject.addObserver(mockObserver2);

        assertEquals(2, notificationSubject.getObservers().size());
        assertTrue(notificationSubject.getObservers().contains(mockObserver1));
        assertTrue(notificationSubject.getObservers().contains(mockObserver2));
    }

    @Test
    @DisplayName("Should prevent adding duplicate observers to NotificationSubject")
    void testAddDuplicateObserver() {
        notificationSubject.addObserver(mockObserver1);
        notificationSubject.addObserver(mockObserver1);

        assertEquals(1, notificationSubject.getObservers().size());
    }

    @Test
    @DisplayName("Should successfully remove an observer from NotificationSubject")
    void testRemoveObserver() {
        notificationSubject.addObserver(mockObserver1);
        notificationSubject.addObserver(mockObserver2);
        notificationSubject.removeObserver(mockObserver1);

        assertEquals(1, notificationSubject.getObservers().size());
        assertFalse(notificationSubject.getObservers().contains(mockObserver1));
        assertTrue(notificationSubject.getObservers().contains(mockObserver2));
    }

    @Test
    @DisplayName("Should notify all registered observers when notifyObservers is called")
    void testNotifyObservers() {
        notificationSubject.addObserver(mockObserver1);
        notificationSubject.addObserver(mockObserver2);

        NotificationEvent event = NotificationEvent.builder()
                .recipient(testCustomer)
                .type(NotificationType.APPOINTMENT)
                .title("Viewing Scheduled")
                .message("Your appointment is confirmed.")
                .build();

        notificationSubject.notifyObservers(event);

        verify(mockObserver1, times(1)).update(event);
        verify(mockObserver2, times(1)).update(event);
    }

    @Test
    @DisplayName("Should automatically register observers passed into constructor (Spring DI simulation)")
    void testSpringConstructorInjection() {
        List<NotificationObserver> observers = List.of(customerNotificationObserver, mockObserver1);
        NotificationSubject subjectWithDI = new NotificationSubject(observers);

        assertEquals(2, subjectWithDI.getObservers().size());
        assertTrue(subjectWithDI.getObservers().contains(customerNotificationObserver));
        assertTrue(subjectWithDI.getObservers().contains(mockObserver1));
    }

    @Test
    @DisplayName("CustomerNotificationObserver delegates to NotificationService.createNotification")
    void testCustomerNotificationObserverDelegation() {
        NotificationEvent event = NotificationEvent.builder()
                .recipient(testCustomer)
                .type(NotificationType.INQUIRY)
                .title("Inquiry Response")
                .message("Staff has replied to your inquiry.")
                .build();

        customerNotificationObserver.update(event);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        ArgumentCaptor<NotificationType> typeCaptor = ArgumentCaptor.forClass(NotificationType.class);
        ArgumentCaptor<String> titleCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> messageCaptor = ArgumentCaptor.forClass(String.class);

        verify(notificationService, times(1)).createNotification(
                userCaptor.capture(),
                typeCaptor.capture(),
                titleCaptor.capture(),
                messageCaptor.capture()
        );

        assertEquals(testCustomer, userCaptor.getValue());
        assertEquals(NotificationType.INQUIRY, typeCaptor.getValue());
        assertEquals("Inquiry Response", titleCaptor.getValue());
        assertEquals("Staff has replied to your inquiry.", messageCaptor.getValue());
    }

    @Test
    @DisplayName("CustomerNotificationObserver safely ignores null events or events without recipient")
    void testCustomerNotificationObserverNullSafety() {
        customerNotificationObserver.update(null);

        NotificationEvent eventWithoutRecipient = NotificationEvent.builder()
                .type(NotificationType.GENERAL)
                .title("Title")
                .message("Message")
                .build();

        customerNotificationObserver.update(eventWithoutRecipient);

        verify(notificationService, never()).createNotification(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Full Observer Pattern flow: Subject -> CustomerNotificationObserver -> NotificationService")
    void testFullObserverPatternFlow() {
        notificationSubject.addObserver(customerNotificationObserver);

        NotificationEvent event = new NotificationEvent(
                testCustomer,
                NotificationType.RESERVATION,
                "Reservation Confirmed",
                "Your reservation is now active."
        );

        notificationSubject.notifyObservers(event);

        verify(notificationService, times(1)).createNotification(
                testCustomer,
                NotificationType.RESERVATION,
                "Reservation Confirmed",
                "Your reservation is now active."
        );
    }
}
