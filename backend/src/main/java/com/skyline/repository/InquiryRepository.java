package com.skyline.repository;

import com.skyline.entity.Inquiry;
import com.skyline.enums.InquiryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    List<Inquiry> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Inquiry> findByCustomerEmailOrderByCreatedAtDesc(String customerEmail);

    List<Inquiry> findByStatus(InquiryStatus status);

    long countByStatusNot(InquiryStatus status);

    long countByStatus(InquiryStatus status);
}
