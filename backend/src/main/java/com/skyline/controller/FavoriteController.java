package com.skyline.controller;

import com.skyline.dto.apartment.ApartmentResponse;
import com.skyline.security.UserPrincipal;
import com.skyline.service.FavoriteService;
import com.skyline.util.IdParser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public ResponseEntity<List<String>> getFavorites(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(favoriteService.getUserFavoriteIds(userPrincipal.getId()));
    }

    @GetMapping("/apartments")
    public ResponseEntity<List<ApartmentResponse>> getFavoriteApartments(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(favoriteService.getUserFavoriteApartments(userPrincipal.getId()));
    }

    @PostMapping("/{apartmentId}")
    public ResponseEntity<Map<String, String>> addFavorite(
            @PathVariable String apartmentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Long numericId = IdParser.parseId(apartmentId);
        favoriteService.addFavorite(userPrincipal.getId(), numericId);
        return ResponseEntity.ok(Map.of("message", "Apartment added to favorites"));
    }

    @DeleteMapping("/{apartmentId}")
    public ResponseEntity<Map<String, String>> removeFavorite(
            @PathVariable String apartmentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Long numericId = IdParser.parseId(apartmentId);
        favoriteService.removeFavorite(userPrincipal.getId(), numericId);
        return ResponseEntity.ok(Map.of("message", "Apartment removed from favorites"));
    }
}
