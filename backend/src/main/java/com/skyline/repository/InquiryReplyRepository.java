package com.skyline.repository;

import com.skyline.entity.InquiryReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InquiryReplyRepository extends JpaRepository<InquiryReply, Long> {
    List<InquiryReply> findByInquiryIdOrderByCreatedAtAsc(Long inquiryId);
}
