package com.skyline.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skyline.dto.UserProfileResponse;
import com.skyline.entity.User;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(
            UserRepository userRepository
    ) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(
            String email
    ) {

        User user = userRepository
                .findByEmail(
                        email.trim().toLowerCase()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User account not found"
                        )
                );

        return new UserProfileResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getStatus(),
                user.getRole().getRoleName(),
                user.getCreatedAt()
        );
    }
}