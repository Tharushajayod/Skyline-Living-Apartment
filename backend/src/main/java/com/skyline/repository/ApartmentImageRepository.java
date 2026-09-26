package com.skyline.repository;

import com.skyline.entity.ApartmentImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApartmentImageRepository extends JpaRepository<ApartmentImage, Long> {
    List<ApartmentImage> findByApartmentId(Long apartmentId);
}
