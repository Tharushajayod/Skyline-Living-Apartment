package com.skyline.service;

import com.skyline.entity.Apartment;
import com.skyline.entity.PaymentPlan;
import com.skyline.entity.PaymentPlanItem;
import com.skyline.entity.User;
import com.skyline.enums.NotificationType;
import com.skyline.enums.PaymentPlanItemStatus;
import com.skyline.enums.PaymentPlanStatus;
import com.skyline.observer.NotificationEvent;
import com.skyline.observer.NotificationSubject;
import com.skyline.repository.NotificationRepository;
import com.skyline.repository.PaymentPlanItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentReminderServiceTest {

    @Mock
    private PaymentPlanItemRepository paymentPlanItemRepository;

    @Mock
    private NotificationSubject notificationSubject;

    @Mock
    private NotificationRepository notificationRepository;

    private PaymentReminderService paymentReminderService;
    private User customer;
    private PaymentPlan plan;
    private PaymentPlanItem dueItem;

    @BeforeEach
    void setUp() {
        paymentReminderService = new PaymentReminderService(
                paymentPlanItemRepository,
                notificationSubject,
                notificationRepository
        );

        customer = User.builder()
                .id(10L)
                .name("Sarah Chen")
                .email("sarah.chen@email.com")
                .build();

        Apartment apartment = Apartment.builder()
                .id(1L)
                .title("Skyline Penthouse")
                .build();

        plan = PaymentPlan.builder()
                .id(100L)
                .customer(customer)
                .apartment(apartment)
                .status(PaymentPlanStatus.APPROVED)
                .build();

        dueItem = PaymentPlanItem.builder()
                .id(501L)
                .paymentPlan(plan)
                .sequenceNo(1)
                .amount(new BigDecimal("150000"))
                .dueDate(LocalDate.now().plusDays(2))
                .status(PaymentPlanItemStatus.UPCOMING)
                .build();
    }

    @Test
    @DisplayName("Payment reminder publishes NotificationEvent to NotificationSubject when item is due")
    void testDueInstallmentPublishesNotificationEvent() {
        when(paymentPlanItemRepository.findAll()).thenReturn(List.of(dueItem));
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(10L)).thenReturn(Collections.emptyList());

        paymentReminderService.sendReminders();

        ArgumentCaptor<NotificationEvent> eventCaptor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(notificationSubject, times(1)).notifyObservers(eventCaptor.capture());

        NotificationEvent published = eventCaptor.getValue();
        assertEquals(customer, published.getRecipient());
        assertEquals(NotificationType.PAYMENT, published.getType());
        assertTrue(published.getTitle().contains("Installment Due"));
        assertTrue(published.getMessage().contains("Payment #1"));
    }
}
