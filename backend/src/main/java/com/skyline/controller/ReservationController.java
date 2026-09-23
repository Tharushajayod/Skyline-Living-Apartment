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

    @GetMapping("/{id}/details")
    public ResponseEntity<com.skyline.dto.reservation.ReservationDetailsResponse> getReservationDetails(@PathVariable String id) {
        Long numericId = IdParser.parseId(id);
        return ResponseEntity.ok(reservationService.getReservationDetails(numericId));
    }

    @GetMapping("/refunds")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<List<com.skyline.dto.reservation.ReservationRefundResponse>> getAllRefunds() {
        return ResponseEntity.ok(reservationService.getAllRefunds());
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> createReservation(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ReservationRequest request) {
        ReservationResponse created = reservationService.createReservation(userPrincipal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<com.skyline.dto.reservation.ReservationRefundResponse> cancelReservationWithRefund(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody com.skyline.dto.reservation.ReservationCancellationRequest request) {
        Long numericId = IdParser.parseId(id);
        com.skyline.dto.reservation.ReservationRefundResponse response = reservationService.cancelReservationWithRefund(numericId, request, userPrincipal);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/refund")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<com.skyline.dto.reservation.ReservationRefundResponse> processExpiredRefund(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody com.skyline.dto.reservation.ReservationCancellationRequest request) {
        Long numericId = IdParser.parseId(id);
        com.skyline.dto.reservation.ReservationRefundResponse response = reservationService.processExpiredRefund(numericId, request, userPrincipal);
        return ResponseEntity.ok(response);
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
