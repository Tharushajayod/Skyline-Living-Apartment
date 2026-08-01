package com.skyline.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skyline.dto.ChangePasswordRequest;
import com.skyline.dto.UpdateUserProfileRequest;
import com.skyline.dto.UserProfileResponse;
import com.skyline.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(
            UserService userService
    ) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserProfileResponse getCurrentUserProfile(
            Authentication authentication
    ) {

        return userService.getCurrentUserProfile(
                authentication.getName()
        );
    }

    @PutMapping("/me")
    public UserProfileResponse updateCurrentUserProfile(
            Authentication authentication,
            @Valid @RequestBody
            UpdateUserProfileRequest request
    ) {

        return userService.updateCurrentUserProfile(
                authentication.getName(),
                request
        );
    }

    @PutMapping("/me/password")
        public ResponseEntity<java.util.Map<String, Object>> changePassword(
                Authentication authentication,
                @Valid @RequestBody ChangePasswordRequest request
        ) {
        userService.changeCurrentUserPassword(
                authentication.getName(),
                request
        );

        return ResponseEntity.ok(
                java.util.Map.of(
                        "success", true,
                        "message", "Password changed successfully"
                )
        );
        }
}