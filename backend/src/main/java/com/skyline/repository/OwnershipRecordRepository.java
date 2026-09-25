package com.skyline.repository;

import com.skyline.entity.OwnershipRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OwnershipRecordRepository extends JpaRepository<OwnershipRecord, Long> {
    List<OwnershipRecord> findByCustomerId(Long customerId);

    @org.springframework.data.jpa.repository.Query("SELECT o FROM OwnershipRecord o WHERE (o.customer IS NOT NULL AND o.customer.id = :customerId) OR (o.customer IS NOT NULL AND o.customer.email IS NOT NULL AND LOWER(o.customer.email) = LOWER(:customerEmail))")
    List<OwnershipRecord> findByCustomerIdOrCustomerEmail(@org.springframework.data.repository.query.Param("customerId") Long customerId, @org.springframework.data.repository.query.Param("customerEmail") String customerEmail);

    Optional<OwnershipRecord> findByApartmentId(Long apartmentId);
}
