package com.skyline.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skyline.dto.CreateStaffRequest;
import com.skyline.dto.StaffResponse;
import com.skyline.service.StaffService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/staff")
@PreAuthorize("hasRole('ADMIN')")
public class AdminStaffController {

    private final StaffService staffService;

    public AdminStaffController(
            StaffService staffService
    ) {
        this.staffService = staffService;
    }

    @PostMapping
    public ResponseEntity<StaffResponse> createStaff(
            @Valid
            @RequestBody
            CreateStaffRequest request
    ) {

        StaffResponse response =
                staffService.createStaff(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}