package com.skyline.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewEligibilityResponse {
    private boolean eligible;
    private String reason;
    private String relationshipType; // "PURCHASED" or "RESERVED" or null
    private String relationshipLabel; // "Purchased" or "Reserved" or null
    private boolean hasReviewed;
    private String existingReviewId;
    private String existingReviewStatus;
}
