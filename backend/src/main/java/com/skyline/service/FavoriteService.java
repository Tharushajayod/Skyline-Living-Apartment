package com.skyline.service;

import com.skyline.dto.apartment.ApartmentResponse;
import com.skyline.entity.Apartment;
import com.skyline.entity.Favorite;
import com.skyline.entity.User;
import com.skyline.repository.FavoriteRepository;
import com.skyline.util.IdParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ApartmentService apartmentService;
    private final UserService userService;

    public FavoriteService(FavoriteRepository favoriteRepository,
                           ApartmentService apartmentService,
                           UserService userService) {
        this.favoriteRepository = favoriteRepository;
        this.apartmentService = apartmentService;
        this.userService = userService;
    }

    public List<String> getUserFavoriteIds(Long userId) {
        return favoriteRepository.findByUserId(userId).stream()
                .filter(f -> f.getApartment() != null)
                .map(f -> IdParser.formatId("APT", f.getApartment().getId()))
                .collect(Collectors.toList());
    }

    public List<ApartmentResponse> getUserFavoriteApartments(Long userId) {
        return favoriteRepository.findByUserId(userId).stream()
                .filter(f -> f.getApartment() != null)
                .map(f -> ApartmentResponse.fromEntity(f.getApartment()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void addFavorite(Long userId, Long apartmentId) {
        if (!favoriteRepository.existsByUserIdAndApartmentId(userId, apartmentId)) {
            User user = userService.getUserEntityById(userId);
            Apartment apartment = apartmentService.getApartmentEntityById(apartmentId);

            Favorite favorite = Favorite.builder()
                    .user(user)
                    .apartment(apartment)
                    .createdAt(LocalDateTime.now())
                    .build();

            favoriteRepository.save(favorite);
        }
    }

    @Transactional
    public void removeFavorite(Long userId, Long apartmentId) {
        favoriteRepository.deleteByUserIdAndApartmentId(userId, apartmentId);
    }
}
