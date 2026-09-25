package com.skyline.service;

import com.skyline.dto.review.EligibleApartmentResponse;
import com.skyline.dto.review.ReviewEligibilityResponse;
import com.skyline.dto.review.ReviewRequest;
import com.skyline.dto.review.ReviewResponse;
import com.skyline.entity.*;
import com.skyline.enums.ReservationStatus;
import com.skyline.enums.ReviewStatus;
import com.skyline.enums.UserRole;
import com.skyline.exception.BadRequestException;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.OwnershipRecordRepository;
import com.skyline.repository.ReservationRepository;
import com.skyline.repository.ReviewRepository;
import com.skyline.repository.SaleRepository;
import com.skyline.security.UserPrincipal;
import com.skyline.util.IdParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ApartmentService apartmentService;
    private final UserService userService;
    private final SaleRepository saleRepository;
    private final OwnershipRecordRepository ownershipRecordRepository;
    private final ReservationRepository reservationRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         ApartmentService apartmentService,
                         UserService userService,
                         SaleRepository saleRepository,
                         OwnershipRecordRepository ownershipRecordRepository,
                         ReservationRepository reservationRepository) {
        this.reviewRepository = reviewRepository;
        this.apartmentService = apartmentService;
        this.userService = userService;
        this.saleRepository = saleRepository;
        this.ownershipRecordRepository = ownershipRecordRepository;
        this.reservationRepository = reservationRepository;
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

        return reviewRepository.findByCustomerIdOrEmail(principal.getId(), principal.getUser().getEmail()).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(ReviewResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ReviewResponse> getPublishedReviewsByApartment(Long apartmentId) {
        return reviewRepository.findByApartmentIdAndStatus(apartmentId, ReviewStatus.PUBLISHED).stream()
                .map(ReviewResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReviewEligibilityResponse checkReviewEligibility(Long apartmentId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            return ReviewEligibilityResponse.builder()
                    .eligible(false)
                    .reason("Authentication required to write a review.")
                    .hasReviewed(false)
                    .build();
        }

        boolean isStaffOrAdmin = principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN;

        Long customerId = principal.getUser().getId();
        String customerEmail = principal.getUser().getEmail();

        // Check if customer already submitted a review
        List<Review> existingReviews = reviewRepository.findByCustomerAndApartment(customerId, customerEmail, apartmentId);
        boolean hasReviewed = !existingReviews.isEmpty();
        String existingReviewId = hasReviewed ? IdParser.formatId("REV", existingReviews.get(0).getId()) : null;
        String existingReviewStatus = hasReviewed && existingReviews.get(0).getStatus() != null ? existingReviews.get(0).getStatus().name() : null;

        if (isStaffOrAdmin) {
            return ReviewEligibilityResponse.builder()
                    .eligible(true)
                    .relationshipType("STAFF")
                    .relationshipLabel("Staff Verified")
                    .hasReviewed(hasReviewed)
                    .existingReviewId(existingReviewId)
                    .existingReviewStatus(existingReviewStatus)
                    .build();
        }

        // Check purchase via Sale
        Optional<Sale> saleOpt = saleRepository.findByApartmentId(apartmentId);
        if (saleOpt.isPresent()) {
            Sale sale = saleOpt.get();
            boolean isOwner = (sale.getCustomer() != null && sale.getCustomer().getId().equals(customerId)) ||
                    (sale.getCustomerEmail() != null && sale.getCustomerEmail().equalsIgnoreCase(customerEmail));
            if (isOwner) {
                return ReviewEligibilityResponse.builder()
                        .eligible(true)
                        .relationshipType("PURCHASED")
                        .relationshipLabel("Purchased")
                        .hasReviewed(hasReviewed)
                        .existingReviewId(existingReviewId)
                        .existingReviewStatus(existingReviewStatus)
                        .build();
            }
        }

        // Check purchase via OwnershipRecord
        Optional<OwnershipRecord> ownershipOpt = ownershipRecordRepository.findByApartmentId(apartmentId);
        if (ownershipOpt.isPresent()) {
            OwnershipRecord rec = ownershipOpt.get();
            boolean isOwner = (rec.getCustomer() != null && rec.getCustomer().getId().equals(customerId)) ||
                    (rec.getCustomer() != null && rec.getCustomer().getEmail() != null && rec.getCustomer().getEmail().equalsIgnoreCase(customerEmail));
            if (isOwner) {
                return ReviewEligibilityResponse.builder()
                        .eligible(true)
                        .relationshipType("PURCHASED")
                        .relationshipLabel("Purchased")
                        .hasReviewed(hasReviewed)
                        .existingReviewId(existingReviewId)
                        .existingReviewStatus(existingReviewStatus)
                        .build();
            }
        }

        // Check reservation
        List<Reservation> rsvs = reservationRepository.findByApartmentId(apartmentId);
        for (Reservation r : rsvs) {
            boolean isCustomer = (r.getCustomer() != null && r.getCustomer().getId().equals(customerId)) ||
                    (r.getCustomerEmail() != null && r.getCustomerEmail().equalsIgnoreCase(customerEmail));
            if (isCustomer) {
                if (r.getStatus() == ReservationStatus.CONFIRMED || r.getStatus() == ReservationStatus.PENDING) {
                    boolean isSold = r.getApartment() != null && r.getApartment().getStatus() == ApartmentStatus.SOLD;
                    return ReviewEligibilityResponse.builder()
                            .eligible(true)
                            .relationshipType(isSold ? "PURCHASED" : "RESERVED")
                            .relationshipLabel(isSold ? "Purchased" : "Reserved")
                            .hasReviewed(hasReviewed)
                            .existingReviewId(existingReviewId)
                            .existingReviewStatus(existingReviewStatus)
                            .build();
                }
            }
        }

        return ReviewEligibilityResponse.builder()
                .eligible(false)
                .reason("You can only write reviews for residences you have reserved or purchased.")
                .hasReviewed(hasReviewed)
                .existingReviewId(existingReviewId)
                .existingReviewStatus(existingReviewStatus)
                .build();
    }

    @Transactional(readOnly = true)
    public List<EligibleApartmentResponse> getEligibleApartmentsForReview(UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            return List.of();
        }
        Long customerId = principal.getUser().getId();
        String customerEmail = principal.getUser().getEmail();

        Map<Long, EligibleApartmentResponse> eligibleMap = new LinkedHashMap<>();

        // 1. Completed Sales
        List<Sale> sales = saleRepository.findByCustomerIdOrCustomerEmail(customerId, customerEmail);
        for (Sale sale : sales) {
            if (sale.getApartment() != null && sale.getApartment().getId() != null) {
                Apartment apt = sale.getApartment();
                eligibleMap.put(apt.getId(), toEligibleResponse(apt, "PURCHASED", "Purchased"));
            }
        }

        // 2. Ownership Records
        List<OwnershipRecord> ownershipRecords = ownershipRecordRepository.findByCustomerIdOrCustomerEmail(customerId, customerEmail);
        for (OwnershipRecord record : ownershipRecords) {
            if (record.getApartment() != null && record.getApartment().getId() != null) {
                Apartment apt = record.getApartment();
                eligibleMap.put(apt.getId(), toEligibleResponse(apt, "PURCHASED", "Purchased"));
            }
        }

        // 3. Customer Reservations
        List<Reservation> reservations = new ArrayList<>(reservationRepository.findByCustomerIdOrderByCreatedAtDesc(customerId));
        if (customerEmail != null && !customerEmail.trim().isEmpty()) {
            List<Reservation> emailRsvs = reservationRepository.findByCustomerEmailOrderByCreatedAtDesc(customerEmail);
            for (Reservation er : emailRsvs) {
                if (reservations.stream().noneMatch(r -> r.getId().equals(er.getId()))) {
                    reservations.add(er);
                }
            }
        }

        for (Reservation rsv : reservations) {
            if (rsv.getApartment() != null && rsv.getApartment().getId() != null) {
                Apartment apt = rsv.getApartment();
                boolean isSold = apt.getStatus() == ApartmentStatus.SOLD;
                boolean isConfirmed = rsv.getStatus() == ReservationStatus.CONFIRMED;
                boolean isPending = rsv.getStatus() == ReservationStatus.PENDING;

                if (isSold || eligibleMap.containsKey(apt.getId())) {
                    eligibleMap.put(apt.getId(), toEligibleResponse(apt, "PURCHASED", "Purchased"));
                } else if (isConfirmed || isPending) {
                    eligibleMap.putIfAbsent(apt.getId(), toEligibleResponse(apt, "RESERVED", "Reserved"));
                }
            }
        }

        // 4. Attach existing review details
        List<Review> customerReviews = reviewRepository.findByCustomerIdOrEmail(customerId, customerEmail);
        Map<Long, Review> reviewMap = new HashMap<>();
        for (Review rev : customerReviews) {
            if (rev.getApartment() != null && rev.getApartment().getId() != null) {
                reviewMap.put(rev.getApartment().getId(), rev);
            }
        }

        for (Map.Entry<Long, EligibleApartmentResponse> entry : eligibleMap.entrySet()) {
            Review existingReview = reviewMap.get(entry.getKey());
            if (existingReview != null) {
                entry.getValue().setHasReviewed(true);
                entry.getValue().setExistingReviewId(IdParser.formatId("REV", existingReview.getId()));
                entry.getValue().setExistingReviewStatus(existingReview.getStatus() != null ? existingReview.getStatus().name() : "PENDING");
                entry.getValue().setExistingReviewRating(existingReview.getRating());
                entry.getValue().setExistingReviewTitle(existingReview.getTitle());
                entry.getValue().setExistingReviewComment(existingReview.getComment());
            }
        }

        return new ArrayList<>(eligibleMap.values());
    }

    private EligibleApartmentResponse toEligibleResponse(Apartment apt, String type, String label) {
        String coverImage = apt.getImages() != null && !apt.getImages().isEmpty()
                ? apt.getImages().get(0).getUrl()
                : (apt.getFloorPlanUrl() != null ? apt.getFloorPlanUrl() : "");

        return EligibleApartmentResponse.builder()
                .id(IdParser.formatId("APT", apt.getId()))
                .numericId(apt.getId())
                .apartmentNumber(apt.getApartmentNumber())
                .title(apt.getTitle())
                .buildingName(apt.getBuildingName())
                .type(apt.getType() != null ? apt.getType().getDisplayValue() : "")
                .price(apt.getPrice())
                .floor(apt.getFloor())
                .size(apt.getSize())
                .bedrooms(apt.getBedrooms())
                .bathrooms(apt.getBathrooms())
                .imageUrl(coverImage)
                .address(apt.getAddress())
                .city(apt.getCity())
                .relationshipType(type)
                .relationshipLabel(label)
                .hasReviewed(false)
                .build();
    }

    @Transactional
    public ReviewResponse createReview(UserPrincipal principal, ReviewRequest request) {
        Long aptId = IdParser.parseId(request.getApartmentId());
        Apartment apartment = apartmentService.getApartmentEntityById(aptId);

        User customer = principal != null ? principal.getUser() : userService.getUserEntityByEmail("sarah.chen@email.com");
        String customerName = request.getCustomerName() != null && !request.getCustomerName().trim().isEmpty()
                ? request.getCustomerName() : customer.getName();

        // Security check: validate review eligibility and prevent duplicate reviews
        if (principal != null) {
            ReviewEligibilityResponse eligibility = checkReviewEligibility(aptId, principal);
            if (!eligibility.isEligible()) {
                throw new BadRequestException("You can only write reviews for residences you have reserved or purchased.");
            }
            if (eligibility.isHasReviewed()) {
                throw new BadRequestException("You have already submitted a review for this residence.");
            }
        }

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
