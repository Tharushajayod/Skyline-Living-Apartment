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

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(a.price), 0) FROM Apartment a WHERE a.status = :status")
    java.math.BigDecimal sumPriceByStatus(@org.springframework.data.repository.query.Param("status") ApartmentStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT a FROM Apartment a LEFT JOIN FETCH a.images ORDER BY a.id ASC")
    List<Apartment> findAllWithImages();

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT a FROM Apartment a WHERE a.id = :id")
    Optional<Apartment> findByIdWithLock(@org.springframework.data.repository.query.Param("id") Long id);
}