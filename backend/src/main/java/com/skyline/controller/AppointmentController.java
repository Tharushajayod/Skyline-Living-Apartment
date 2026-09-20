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

    @PatchMapping("/{id}/status")
    public ResponseEntity<AppointmentResponse> updateStatus(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody AppointmentStatusUpdate update) {
        Long numericId = IdParser.parseId(id);
        AppointmentResponse updated = appointmentService.updateStatus(numericId, update, userPrincipal);
        return ResponseEntity.ok(updated);
    }
}
