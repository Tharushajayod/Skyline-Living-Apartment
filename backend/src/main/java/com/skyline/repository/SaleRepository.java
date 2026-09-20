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

    Optional<Sale> findByApartmentId(Long apartmentId);

    @Query("SELECT COALESCE(SUM(s.finalPrice), 0) FROM Sale s")
    BigDecimal sumTotalSalesRevenue();
}
