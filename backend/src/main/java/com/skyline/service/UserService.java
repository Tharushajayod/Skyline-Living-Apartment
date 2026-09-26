package com.skyline.service;

import com.skyline.dto.user.ChangePasswordRequest;
import com.skyline.dto.user.UpdateProfileRequest;
import com.skyline.dto.user.UserDto;
import com.skyline.entity.User;
import com.skyline.enums.UserRole;
import com.skyline.enums.UserStatus;
import com.skyline.exception.BadRequestException;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserDto.fromEntity(user);
    }

    public User getUserEntityByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public User getUserEntityById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Transactional
    public UserDto updateUserRole(Long id, UserRole role) {
        User user = getUserEntityById(id);
        user.setRole(role);
        return UserDto.fromEntity(userRepository.save(user));
    }

    @Transactional
    public UserDto updateUserStatus(Long id, UserStatus status) {
        User user = getUserEntityById(id);
        user.setStatus(status);
        return UserDto.fromEntity(userRepository.save(user));
    }

    @Transactional
    public UserDto updateProfile(String email, UpdateProfileRequest request) {
        User user = getUserEntityByEmail(email);
        user.setName(request.getName().trim());
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }
        return UserDto.fromEntity(userRepository.save(user));
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = getUserEntityByEmail(email);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
