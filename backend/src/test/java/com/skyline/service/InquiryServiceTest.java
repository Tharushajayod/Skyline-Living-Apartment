package com.skyline.service;

import com.skyline.dto.inquiry.InquiryReplyRequest;
import com.skyline.dto.inquiry.InquiryResponse;
import com.skyline.entity.Inquiry;
import com.skyline.entity.User;
import com.skyline.enums.InquiryStatus;
import com.skyline.enums.NotificationType;
import com.skyline.enums.UserRole;
import com.skyline.observer.NotificationEvent;
import com.skyline.observer.NotificationSubject;
import com.skyline.repository.InquiryReplyRepository;
import com.skyline.repository.InquiryRepository;
import com.skyline.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InquiryServiceTest {

    @Mock
    private InquiryRepository inquiryRepository;

    @Mock
    private InquiryReplyRepository inquiryReplyRepository;

    @Mock
    private ApartmentService apartmentService;

    @Mock
    private UserService userService;

    @Mock
    private NotificationSubject notificationSubject;

    private InquiryService inquiryService;

    private User customer;
    private User staff;
    private UserPrincipal staffPrincipal;
    private Inquiry inquiry;

    @BeforeEach
    void setUp() {
        inquiryService = new InquiryService(
                inquiryRepository,
                inquiryReplyRepository,
                apartmentService,
                userService,
                notificationSubject
        );

        customer = User.builder()
                .id(10L)
                .name("Sarah Chen")
                .email("sarah.chen@email.com")
                .role(UserRole.CUSTOMER)
                .build();

        staff = User.builder()
                .id(2L)
                .name("Alex Concierge")
                .email("staff@skylineliving.com")
                .role(UserRole.STAFF)
                .build();

        staffPrincipal = new UserPrincipal(staff);

        inquiry = Inquiry.builder()
                .id(100L)
                .customer(customer)
                .customerName("Sarah Chen")
                .customerEmail("sarah.chen@email.com")
                .subject("Question about parking")
                .message("Is parking included?")
                .status(InquiryStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .replies(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("Adding staff reply publishes NotificationEvent to NotificationSubject")
    void testStaffReplyPublishesNotificationEventToSubject() {
        when(inquiryRepository.findById(100L)).thenReturn(Optional.of(inquiry));
        when(inquiryRepository.save(any(Inquiry.class))).thenAnswer(i -> i.getArgument(0));

        InquiryReplyRequest request = new InquiryReplyRequest("Yes, 1 dedicated parking slot is included.");

        InquiryResponse response = inquiryService.addReply(100L, request, staffPrincipal);

        assertNotNull(response);
        assertEquals(InquiryStatus.IN_PROGRESS, inquiry.getStatus());

        ArgumentCaptor<NotificationEvent> eventCaptor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(notificationSubject, times(1)).notifyObservers(eventCaptor.capture());

        NotificationEvent publishedEvent = eventCaptor.getValue();
        assertEquals(customer, publishedEvent.getRecipient());
        assertEquals(NotificationType.INQUIRY, publishedEvent.getType());
        assertEquals("New Reply on Your Inquiry", publishedEvent.getTitle());
        assertTrue(publishedEvent.getMessage().contains("Question about parking"));
    }
}
