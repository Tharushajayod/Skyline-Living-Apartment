package com.skyline.repository;

import com.skyline.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findByCustomerId(Long customerId);

    @Query("SELECT s FROM Sale s WHERE (s.customer IS NOT NULL AND s.customer.id = :customerId) OR (s.customerEmail IS NOT NULL AND LOWER(s.customerEmail) = LOWER(:customerEmail))")
    List<Sale> findByCustomerIdOrCustomerEmail(@org.springframework.data.repository.query.Param("customerId") Long customerId, @org.springframework.data.repository.query.Param("customerEmail") String customerEmail);

    Optional<Sale> findByApartmentId(Long apartmentId);

    List<Sale> findByApartmentIdIn(java.util.Collection<Long> apartmentIds);

    @Query("SELECT COALESCE(SUM(s.finalPrice), 0) FROM Sale s")
    BigDecimal sumTotalSalesRevenue();

    @Query("SELECT COALESCE(SUM(s.finalPrice), 0) FROM Sale s WHERE s.saleDate >= :start AND s.saleDate <= :end")
    BigDecimal sumFinalPriceBySaleDateBetween(
            @org.springframework.data.repository.query.Param("start") java.time.LocalDate start,
            @org.springframework.data.repository.query.Param("end") java.time.LocalDate end
    );

    long countBySaleDateBetween(java.time.LocalDate start, java.time.LocalDate end);

    List<Sale> findBySaleDateBetween(java.time.LocalDate start, java.time.LocalDate end);
}
