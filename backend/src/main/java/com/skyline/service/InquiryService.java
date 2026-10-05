package com.skyline.service;

import com.skyline.dto.inquiry.InquiryReplyRequest;
import com.skyline.dto.inquiry.InquiryRequest;
import com.skyline.dto.inquiry.InquiryResponse;
import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Inquiry;
import com.skyline.entity.InquiryReply;
import com.skyline.entity.User;
import com.skyline.enums.*;
import com.skyline.exception.BadRequestException;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.observer.NotificationEvent;
import com.skyline.observer.NotificationSubject;
import com.skyline.repository.InquiryReplyRepository;
import com.skyline.repository.InquiryRepository;
import com.skyline.security.UserPrincipal;
import com.skyline.util.IdParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final InquiryReplyRepository inquiryReplyRepository;
    private final ApartmentService apartmentService;
    private final UserService userService;
    private final NotificationSubject notificationSubject;

    public InquiryService(InquiryRepository inquiryRepository,
                          InquiryReplyRepository inquiryReplyRepository,
                          ApartmentService apartmentService,
                          UserService userService,
                          NotificationSubject notificationSubject) {
        this.inquiryRepository = inquiryRepository;
        this.inquiryReplyRepository = inquiryReplyRepository;
        this.apartmentService = apartmentService;
        this.userService = userService;
        this.notificationSubject = notificationSubject;
    }

    public List<InquiryResponse> getInquiries(UserPrincipal principal, String customerParam) {
        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        if (isStaffOrAdmin) {
            if (customerParam != null && !customerParam.trim().isEmpty()) {
                return inquiryRepository.findByCustomerEmailOrderByCreatedAtDesc(customerParam.trim()).stream()
                        .map(InquiryResponse::fromEntity)
                        .collect(Collectors.toList());
            }
            return inquiryRepository.findAll().stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .map(InquiryResponse::fromEntity)
                    .collect(Collectors.toList());
        }

        Long customerId = principal != null ? principal.getId() : null;
        if (customerId == null && customerParam != null) {
            return inquiryRepository.findByCustomerEmailOrderByCreatedAtDesc(customerParam.trim()).stream()
                    .map(InquiryResponse::fromEntity)
                    .collect(Collectors.toList());
        }
        if (customerId != null) {
            return inquiryRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                    .map(InquiryResponse::fromEntity)
                    .collect(Collectors.toList());
        }
        return List.of();
    }

    public InquiryResponse getInquiryById(Long id) {
        return inquiryRepository.findById(id)
                .map(InquiryResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Inquiry not found with id: " + id));
    }

    @Transactional
    public InquiryResponse createInquiry(UserPrincipal principal, InquiryRequest request) {
        Apartment apartment = null;
        String aptTitle = request.getApartmentTitle();
        if (request.getApartmentId() != null && !request.getApartmentId().trim().isEmpty()) {
            Long aptId = IdParser.parseId(request.getApartmentId());
            apartment = apartmentService.getApartmentEntityById(aptId);
            if (apartment.getStatus() == ApartmentStatus.SOLD) {
                throw new BadRequestException("Cannot submit inquiry for a sold apartment");
            }
            aptTitle = apartment.getTitle();
        }

        User customer;
        if (principal != null) {
            customer = principal.getUser();
        } else if (request.getCustomerEmail() != null) {
            customer = userService.getUserEntityByEmail(request.getCustomerEmail());
        } else {
            customer = userService.getUserEntityByEmail("sarah.chen@email.com");
        }

        Inquiry inquiry = Inquiry.builder()
                .apartment(apartment)
                .customer(customer)
                .customerName(request.getCustomerName() != null ? request.getCustomerName() : customer.getName())
                .customerEmail(request.getCustomerEmail() != null ? request.getCustomerEmail() : customer.getEmail())
                .apartmentTitle(aptTitle)
                .subject(request.getSubject())
                .message(request.getMessage())
                .category(request.getCategory() != null ? request.getCategory() : InquiryCategory.GENERAL)
                .priority(request.getPriority() != null ? request.getPriority() : InquiryPriority.MEDIUM)
                .status(InquiryStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        Inquiry saved = inquiryRepository.save(inquiry);
        return InquiryResponse.fromEntity(saved);
    }

    @Transactional
    public InquiryResponse addReply(Long id, InquiryReplyRequest request, UserPrincipal principal) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inquiry not found with id: " + id));

        User author = principal != null ? principal.getUser() : userService.getUserEntityByEmail("staff@skylineliving.com");

        InquiryReply reply = InquiryReply.builder()
                .inquiry(inquiry)
                .author(author)
                .authorName(author.getName())
                .authorRole(author.getRole())
                .message(request.getMessage())
                .createdAt(LocalDateTime.now())
                .build();

        inquiryReplyRepository.save(reply);
        inquiry.addReply(reply);

        if (author.getRole() == UserRole.STAFF || author.getRole() == UserRole.ADMIN) {
            if (inquiry.getStatus() == InquiryStatus.PENDING) {
                inquiry.setStatus(InquiryStatus.IN_PROGRESS);
            }

            notificationSubject.notifyObservers(new NotificationEvent(
                    inquiry.getCustomer(),
                    NotificationType.INQUIRY,
                    "New Reply on Your Inquiry",
                    "A staff member replied to your inquiry: \"" + inquiry.getSubject() + "\"."
            ));
        }

        Inquiry saved = inquiryRepository.save(inquiry);
        return InquiryResponse.fromEntity(saved);
    }

    @Transactional
    public InquiryResponse updateStatus(Long id, InquiryStatus status) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inquiry not found with id: " + id));
        inquiry.setStatus(status);
        Inquiry saved = inquiryRepository.save(inquiry);
        return InquiryResponse.fromEntity(saved);
    }

    @Transactional
    public InquiryResponse updatePriority(Long id, InquiryPriority priority) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inquiry not found with id: " + id));
        inquiry.setPriority(priority);
        Inquiry saved = inquiryRepository.save(inquiry);
        return InquiryResponse.fromEntity(saved);
    }
}
