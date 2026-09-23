package com.skyline.service;

import com.skyline.dto.review.ReviewRequest;
import com.skyline.dto.review.ReviewResponse;
import com.skyline.entity.Apartment;
import com.skyline.entity.Review;
import com.skyline.entity.User;
import com.skyline.enums.ReviewStatus;
import com.skyline.enums.UserRole;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.ReviewRepository;
import com.skyline.security.UserPrincipal;
import com.skyline.util.IdParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ApartmentService apartmentService;
    private final UserService userService;

    public ReviewService(ReviewRepository reviewRepository,
                         ApartmentService apartmentService,
                         UserService userService) {
        this.reviewRepository = reviewRepository;
        this.apartmentService = apartmentService;
        this.userService = userService;
    }

    public List<ReviewResponse> getPublicApprovedReviews() {
        return reviewRepository.findByStatus(ReviewStatus.PUBLISHED).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(ReviewResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ReviewResponse> getAllReviews(UserPrincipal principal) {
        if (principal == null) {
            return getPublicApprovedReviews();
        }

        boolean isStaffOrAdmin = principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN;

        if (isStaffOrAdmin) {
            return reviewRepository.findAll().stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .map(ReviewResponse::fromEntity)
                    .collect(Collectors.toList());
        }

        return reviewRepository.findByCustomerId(principal.getId()).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(ReviewResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ReviewResponse> getPublishedReviewsByApartment(Long apartmentId) {
        return reviewRepository.findByApartmentIdAndStatus(apartmentId, ReviewStatus.PUBLISHED).stream()
                .map(ReviewResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReviewResponse createReview(UserPrincipal principal, ReviewRequest request) {
        Long aptId = IdParser.parseId(request.getApartmentId());
        Apartment apartment = apartmentService.getApartmentEntityById(aptId);

        User customer = principal != null ? principal.getUser() : userService.getUserEntityByEmail("sarah.chen@email.com");
        String customerName = request.getCustomerName() != null && !request.getCustomerName().trim().isEmpty()
                ? request.getCustomerName() : customer.getName();

        Review review = Review.builder()
                .apartment(apartment)
                .customer(customer)
                .customerName(customerName)
                .apartmentTitle(apartment.getTitle())
                .rating(request.getRating())
                .title(request.getTitle())
                .comment(request.getComment())
                .status(ReviewStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        Review saved = reviewRepository.save(review);
        return ReviewResponse.fromEntity(saved);
    }

    @Transactional
    public ReviewResponse moderateReview(Long id, ReviewStatus status) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));
        review.setStatus(status);
        Review saved = reviewRepository.save(review);
        return ReviewResponse.fromEntity(saved);
    }
}
