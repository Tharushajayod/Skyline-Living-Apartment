package com.skyline.controller;

import com.skyline.dto.StaffSummaryResponse;
import com.skyline.dto.UpdateUserStatusRequest;
import com.skyline.dto.UserSummaryResponse;
import com.skyline.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(
            AdminUserService adminUserService
    ) {
        this.adminUserService = adminUserService;
    }

    @GetMapping("/users")
    public List<UserSummaryResponse> getAllUsers() {

        return adminUserService.getAllUsers();
    }

    @GetMapping("/users/{userId}")
    public UserSummaryResponse getUserById(
            @PathVariable Long userId
    ) {

        return adminUserService.getUserById(userId);
    }

    @PatchMapping("/users/{userId}/status")
    public UserSummaryResponse updateUserStatus(
            @PathVariable Long userId,

            @Valid
            @RequestBody
            UpdateUserStatusRequest request
    ) {

        return adminUserService.updateUserStatus(
                userId,
                request
        );
    }

    @GetMapping("/staff")
    public List<StaffSummaryResponse> getAllStaff() {

        return adminUserService.getAllStaff();
    }
}