package com.skyline.controller;

import com.skyline.dto.auth.AuthResponse;
import com.skyline.dto.auth.LoginRequest;
import com.skyline.dto.auth.RegisterRequest;
import com.skyline.dto.user.UserDto;
import com.skyline.dto.user.ChangePasswordRequest;
import com.skyline.security.UserPrincipal;
import com.skyline.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        // userPrincipal thiyenam eken gannawa, nathnam request eke email eken gannawa
        String userEmail = (userPrincipal != null) ? userPrincipal.getUsername() : request.getEmail();

        if (userEmail == null || userEmail.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User email is required");
        }

        authService.changePassword(userEmail, request);
        return ResponseEntity.ok("Password changed successfully");
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserDto user = authService.getCurrentUser(userPrincipal.getUsername());
        return ResponseEntity.ok(user);
    }
}
