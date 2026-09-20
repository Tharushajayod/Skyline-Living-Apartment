package com.skyline.repository;

import com.skyline.entity.OwnershipRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OwnershipRecordRepository extends JpaRepository<OwnershipRecord, Long> {
    List<OwnershipRecord> findByCustomerId(Long customerId);
    Optional<OwnershipRecord> findByApartmentId(Long apartmentId);
}
