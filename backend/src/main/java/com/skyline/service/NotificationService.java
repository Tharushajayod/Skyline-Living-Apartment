package com.skyline.service;

import com.skyline.dto.notification.NotificationResponse;
import com.skyline.entity.Notification;
import com.skyline.entity.User;
import com.skyline.enums.NotificationType;
import com.skyline.enums.UserRole;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.NotificationRepository;
import com.skyline.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void createNotification(User user, NotificationType type, String title, String message) {
        if (user == null) return;
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyStaffAndAdmins(NotificationType type, String title, String message) {
        List<User> admins = userRepository.findByRole(UserRole.ADMIN);
        List<User> staff = userRepository.findByRole(UserRole.STAFF);
        Set<User> recipients = new HashSet<>();
        if (admins != null) recipients.addAll(admins);
        if (staff != null) recipients.addAll(staff);

        List<Notification> notifications = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (User user : recipients) {
            notifications.add(Notification.builder()
                    .user(user)
                    .type(type)
                    .title(title)
                    .message(message)
                    .read(false)
                    .createdAt(now)
                    .build());
        }
        if (!notifications.isEmpty()) {
            notificationRepository.saveAll(notifications);
        }
    }

    public List<NotificationResponse> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        if (notification.getUser().getId().equals(userId)) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (Notification n : notifications) {
            n.setRead(true);
        }
        notificationRepository.saveAll(notifications);
    }
}
