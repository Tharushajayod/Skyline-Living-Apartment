package com.skyline.controller;

import com.skyline.dto.apartment.ApartmentRequest;
import com.skyline.dto.apartment.ApartmentResponse;
import com.skyline.entity.ApartmentStatus;
import com.skyline.enums.ApartmentType;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.service.ApartmentService;
import com.skyline.util.IdParser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/apartments")
public class ApartmentController {

    private final ApartmentService apartmentService;

    public ApartmentController(ApartmentService apartmentService) {
        this.apartmentService = apartmentService;
    }

    @GetMapping
    public ResponseEntity<List<ApartmentResponse>> getApartments(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ApartmentType type,
            @RequestParam(required = false) ApartmentStatus status,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) Integer bedrooms,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) Boolean includeSold) {

        List<ApartmentResponse> result = apartmentService.searchApartments(
                search, type, status, district, bedrooms, minPrice, maxPrice, featured, includeSold);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApartmentResponse> getApartmentById(@PathVariable String id) {
        Long numericId = IdParser.parseId(id);
        ApartmentResponse apartment = apartmentService.getApartmentById(numericId)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + id));
        return ResponseEntity.ok(apartment);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<ApartmentResponse> createApartment(@Valid @RequestBody ApartmentRequest request) {
        ApartmentResponse created = apartmentService.createApartment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<ApartmentResponse> updateApartment(
            @PathVariable String id,
            @Valid @RequestBody ApartmentRequest request) {
        Long numericId = IdParser.parseId(id);
        ApartmentResponse updated = apartmentService.updateApartment(numericId, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Map<String, String>> deleteApartment(@PathVariable String id) {
        Long numericId = IdParser.parseId(id);
        apartmentService.deleteApartment(numericId);
        return ResponseEntity.ok(Map.of("message", "Apartment deleted successfully"));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ApartmentResponse>> getApartmentsByStatus(@PathVariable ApartmentStatus status) {
        return ResponseEntity.ok(apartmentService.getApartmentsByStatus(status));
    }
}