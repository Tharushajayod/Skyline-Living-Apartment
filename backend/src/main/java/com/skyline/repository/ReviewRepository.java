package com.skyline.repository;

import com.skyline.entity.Review;
import com.skyline.enums.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByApartmentIdAndStatus(Long apartmentId, ReviewStatus status);

    List<Review> findByApartmentId(Long apartmentId);

    List<Review> findByCustomerId(Long customerId);

    List<Review> findByStatus(ReviewStatus status);
}
