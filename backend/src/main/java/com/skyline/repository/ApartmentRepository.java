package com.skyline.repository;

import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApartmentRepository extends JpaRepository<Apartment, Long>, JpaSpecificationExecutor<Apartment> {

    List<Apartment> findByStatus(ApartmentStatus status);

    Optional<Apartment> findByApartmentNumber(String apartmentNumber);

    long countByStatus(ApartmentStatus status);
}