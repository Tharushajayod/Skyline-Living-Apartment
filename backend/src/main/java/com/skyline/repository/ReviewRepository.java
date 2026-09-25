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

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Review r WHERE (r.customer.id = :customerId OR (r.customer.email IS NOT NULL AND LOWER(r.customer.email) = LOWER(:customerEmail))) AND r.apartment.id = :apartmentId")
    List<Review> findByCustomerAndApartment(
            @org.springframework.data.repository.query.Param("customerId") Long customerId,
            @org.springframework.data.repository.query.Param("customerEmail") String customerEmail,
            @org.springframework.data.repository.query.Param("apartmentId") Long apartmentId
    );

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Review r WHERE r.customer.id = :customerId OR (r.customer.email IS NOT NULL AND LOWER(r.customer.email) = LOWER(:customerEmail))")
    List<Review> findByCustomerIdOrEmail(
            @org.springframework.data.repository.query.Param("customerId") Long customerId,
            @org.springframework.data.repository.query.Param("customerEmail") String customerEmail
    );

    List<Review> findByStatus(ReviewStatus status);
}
