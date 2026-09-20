package com.skyline.controller;

import com.skyline.dto.reservation.ReservationRequest;
import com.skyline.dto.reservation.ReservationResponse;
import com.skyline.dto.reservation.ReservationStatusUpdate;
import com.skyline.security.UserPrincipal;
import com.skyline.service.ReservationService;
import com.skyline.util.IdParser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping
    public ResponseEntity<List<ReservationResponse>> getReservations(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false, name = "customer") String customerParam) {
        List<ReservationResponse> result = reservationService.getReservations(userPrincipal, customerParam);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponse> getReservationById(@PathVariable String id) {
        Long numericId = IdParser.parseId(id);
        return ResponseEntity.ok(reservationService.getReservationById(numericId));
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> createReservation(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ReservationRequest request) {
        ReservationResponse created = reservationService.createReservation(userPrincipal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ReservationResponse> updateStatus(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody ReservationStatusUpdate update) {
        Long numericId = IdParser.parseId(id);
        ReservationResponse updated = reservationService.updateStatus(numericId, update, userPrincipal);
        return ResponseEntity.ok(updated);
    }
}
