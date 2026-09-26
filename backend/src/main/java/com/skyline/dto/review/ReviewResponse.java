package com.skyline.dto.review;

import com.skyline.entity.Review;
import com.skyline.enums.ReviewStatus;
import com.skyline.util.IdParser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.format.DateTimeFormatter;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private String id;
    private String apartmentId;
    private String apartmentTitle;
    private String customerName;
    private Integer rating;
    private String title;
    private String comment;
    private ReviewStatus status;
    private String createdAt;

    public static ReviewResponse fromEntity(Review r) {
        if (r == null) return null;
        return ReviewResponse.builder()
                .id(IdParser.formatId("REV", r.getId()))
                .apartmentId(r.getApartment() != null ? IdParser.formatId("APT", r.getApartment().getId()) : "")
                .apartmentTitle(r.getApartmentTitle() != null ? r.getApartmentTitle() : (r.getApartment() != null ? r.getApartment().getTitle() : ""))
                .customerName(r.getCustomerName() != null ? r.getCustomerName() : (r.getCustomer() != null ? r.getCustomer().getName() : ""))
                .rating(r.getRating())
                .title(r.getTitle())
                .comment(r.getComment())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : "")
                .build();
    }
}
