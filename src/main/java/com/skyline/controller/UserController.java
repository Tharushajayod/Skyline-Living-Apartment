package com.skyline.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skyline.dto.UserProfileResponse;
import com.skyline.service.UserService;

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

        String loggedInUserEmail =
                authentication.getName();

        return userService.getCurrentUserProfile(
                loggedInUserEmail
        );
    }
}