package com.skyline.repository;

import com.skyline.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findByUserId(Long userId);

    boolean existsByUserIdAndApartmentId(Long userId, Long apartmentId);

    Optional<Favorite> findByUserIdAndApartmentId(Long userId, Long apartmentId);

    void deleteByUserIdAndApartmentId(Long userId, Long apartmentId);
}
