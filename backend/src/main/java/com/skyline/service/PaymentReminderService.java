package com.skyline.service;

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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class PaymentReminderService {

    private static final Logger log = LoggerFactory.getLogger(PaymentReminderService.class);

    private final PaymentPlanItemRepository paymentPlanItemRepository;
    private final NotificationSubject notificationSubject;
    private final NotificationRepository notificationRepository;

    public PaymentReminderService(PaymentPlanItemRepository paymentPlanItemRepository,
                                  NotificationSubject notificationSubject,
                                  NotificationRepository notificationRepository) {
        this.paymentPlanItemRepository = paymentPlanItemRepository;
        this.notificationSubject = notificationSubject;
        this.notificationRepository = notificationRepository;
    }

    /**
     * Daily reminder at 8:00 AM for due or upcoming installment payments.
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void checkAndSendDuePaymentReminders() {
        sendReminders();
    }

    /**
     * Send reminders on application startup as well.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void onStartup() {
        sendReminders();
    }

    @Transactional
    public void sendReminders() {
        try {
            LocalDate today = LocalDate.now();
            LocalDate reminderWindow = today.plusDays(3); // notify if due within 3 days or today/overdue

            List<PaymentPlanItem> items = paymentPlanItemRepository.findAll().stream()
                    .filter(item -> item.getStatus() == PaymentPlanItemStatus.UPCOMING)
                    .filter(item -> item.getDueDate() != null && !item.getDueDate().isAfter(reminderWindow))
                    .toList();

            for (PaymentPlanItem item : items) {
                PaymentPlan plan = item.getPaymentPlan();
                if (plan == null || plan.getStatus() != PaymentPlanStatus.APPROVED) {
                    continue;
                }

                User customer = plan.getCustomer();
                if (customer == null) {
                    continue;
                }

                String title = "Installment Due: Payment #" + item.getSequenceNo() + " (" + plan.getApartment().getTitle() + ")";

                // Avoid duplicate reminders to the same customer on the same day
                boolean alreadySentToday = notificationRepository.findByUserIdOrderByCreatedAtDesc(customer.getId())
                        .stream()
                        .anyMatch(n -> title.equals(n.getTitle()) && n.getCreatedAt() != null && n.getCreatedAt().toLocalDate().isEqual(today));

                if (!alreadySentToday) {
                    String message;
                    if (item.getDueDate().isBefore(today)) {
                        message = "Payment #" + item.getSequenceNo() + " of Rs. " + item.getAmount() +
                                " for " + plan.getApartment().getTitle() + " was due on " + item.getDueDate() +
                                ". Please submit your payment receipt.";
                    } else if (item.getDueDate().isEqual(today)) {
                        message = "Payment #" + item.getSequenceNo() + " of Rs. " + item.getAmount() +
                                " for " + plan.getApartment().getTitle() + " is due today (" + item.getDueDate() +
                                "). Please submit your payment receipt.";
                    } else {
                        message = "Upcoming installment: Payment #" + item.getSequenceNo() + " of Rs. " + item.getAmount() +
                                " for " + plan.getApartment().getTitle() + " is due on " + item.getDueDate() +
                                ".";
                    }

                    notificationSubject.notifyObservers(new NotificationEvent(customer, NotificationType.PAYMENT, title, message));
                    log.info("Sent installment reminder to customer {} for item #{}", customer.getEmail(), item.getId());
                }
            }
        } catch (Exception e) {
            log.error("Error running payment reminder check: {}", e.getMessage(), e);
        }
    }
}
