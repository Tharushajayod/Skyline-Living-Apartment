package com.skyline.controller;

import com.skyline.dto.user.ChangePasswordRequest;
import com.skyline.dto.user.UpdateProfileRequest;
import com.skyline.dto.user.UserDto;
import com.skyline.enums.UserRole;
import com.skyline.enums.UserStatus;
import com.skyline.security.UserPrincipal;
import com.skyline.service.UserService;
import com.skyline.util.IdParser;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<UserDto> getUserById(@PathVariable String id) {
        Long numericId = IdParser.parseId(id);
        return ResponseEntity.ok(userService.getUserById(numericId));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateUserRole(@PathVariable String id, @RequestBody Map<String, String> payload) {
        Long numericId = IdParser.parseId(id);
        String roleStr = payload.get("role");
        UserRole role = UserRole.fromString(roleStr);
        return ResponseEntity.ok(userService.updateUserRole(numericId, role));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateUserStatus(@PathVariable String id, @RequestBody Map<String, String> payload) {
        Long numericId = IdParser.parseId(id);
        String statusStr = payload.get("status");
        UserStatus status = UserStatus.fromString(statusStr);
        return ResponseEntity.ok(userService.updateUserStatus(numericId, status));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserDto updated = userService.updateProfile(userPrincipal.getUsername(), request);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userPrincipal.getUsername(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
