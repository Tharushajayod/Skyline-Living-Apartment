package com.skyline.controller;

import com.skyline.dto.appointment.AppointmentRequest;
import com.skyline.dto.appointment.AppointmentResponse;
import com.skyline.dto.appointment.AppointmentStatusUpdate;
import com.skyline.security.UserPrincipal;
import com.skyline.service.AppointmentService;
import com.skyline.util.IdParser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> getAppointments(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false, name = "customer") String customerParam) {
        List<AppointmentResponse> result = appointmentService.getAppointments(userPrincipal, customerParam);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<AppointmentResponse> createAppointment(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AppointmentRequest request) {
        AppointmentResponse created = appointmentService.createAppointment(userPrincipal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<com.skyline.dto.appointment.AppointmentRescheduleHistoryResponse>> getAppointmentHistory(@PathVariable String id) {
        Long numericId = IdParser.parseId(id);
        return ResponseEntity.ok(appointmentService.getAppointmentHistory(numericId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AppointmentResponse> updateStatus(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody AppointmentStatusUpdate update) {
        Long numericId = IdParser.parseId(id);
        AppointmentResponse updated = appointmentService.updateStatus(numericId, update, userPrincipal);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/reschedule-proposal")
    public ResponseEntity<AppointmentResponse> proposeReschedule(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody com.skyline.dto.appointment.RescheduleProposalRequest request) {
        Long numericId = IdParser.parseId(id);
        AppointmentResponse updated = appointmentService.proposeReschedule(numericId, request, userPrincipal);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/reschedule-accept")
    public ResponseEntity<AppointmentResponse> acceptReschedule(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long numericId = IdParser.parseId(id);
        AppointmentResponse updated = appointmentService.acceptReschedule(numericId, userPrincipal);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/reschedule-reject")
    public ResponseEntity<AppointmentResponse> rejectReschedule(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) String reason) {
        Long numericId = IdParser.parseId(id);
        AppointmentResponse updated = appointmentService.rejectReschedule(numericId, reason, userPrincipal);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<AppointmentResponse> completeAppointment(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long numericId = IdParser.parseId(id);
        AppointmentResponse updated = appointmentService.completeAppointment(numericId, userPrincipal);
        return ResponseEntity.ok(updated);
    }
}
