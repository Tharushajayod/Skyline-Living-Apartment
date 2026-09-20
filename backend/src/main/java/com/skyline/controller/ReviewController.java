package com.skyline.controller;

import com.skyline.dto.review.ReviewRequest;
import com.skyline.dto.review.ReviewResponse;
import com.skyline.enums.ReviewStatus;
import com.skyline.security.UserPrincipal;
import com.skyline.service.ReviewService;
import com.skyline.util.IdParser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/api/reviews")
    public ResponseEntity<List<ReviewResponse>> getAllReviews(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(reviewService.getAllReviews(userPrincipal));
    }

    @GetMapping("/api/apartments/{apartmentId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getApartmentReviews(@PathVariable String apartmentId) {
        Long numericId = IdParser.parseId(apartmentId);
        return ResponseEntity.ok(reviewService.getPublishedReviewsByApartment(numericId));
    }

    @PostMapping("/api/reviews")
    public ResponseEntity<ReviewResponse> createReview(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ReviewRequest request) {
        ReviewResponse created = reviewService.createReview(userPrincipal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/api/reviews/{id}/moderate")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<ReviewResponse> moderateReview(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        Long numericId = IdParser.parseId(id);
        ReviewStatus status = ReviewStatus.fromString(payload.get("status"));
        ReviewResponse moderated = reviewService.moderateReview(numericId, status);
        return ResponseEntity.ok(moderated);
    }
}
