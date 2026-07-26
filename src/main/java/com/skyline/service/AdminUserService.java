package com.skyline.service;

import com.skyline.dto.StaffSummaryResponse;
import com.skyline.dto.UpdateUserStatusRequest;
import com.skyline.dto.UserSummaryResponse;
import com.skyline.entity.Staff;
import com.skyline.entity.User;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.StaffRepository;
import com.skyline.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class AdminUserService {

    private static final Set<String> ALLOWED_STATUSES =
            Set.of(
                    "ACTIVE",
                    "INACTIVE",
                    "BLOCKED"
            );

    private final UserRepository userRepository;
    private final StaffRepository staffRepository;

    public AdminUserService(
            UserRepository userRepository,
            StaffRepository staffRepository
    ) {
        this.userRepository = userRepository;
        this.staffRepository = staffRepository;
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getAllUsers() {

        return userRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapUser)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserSummaryResponse getUserById(
            Long userId
    ) {

        User user = userRepository
                .findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User account not found"
                        )
                );

        return mapUser(user);
    }

    @Transactional
    public UserSummaryResponse updateUserStatus(
            Long userId,
            UpdateUserStatusRequest request
    ) {

        User user = userRepository
                .findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User account not found"
                        )
                );

        String normalizedStatus =
                request.status()
                        .trim()
                        .toUpperCase();

        if (!ALLOWED_STATUSES.contains(normalizedStatus)) {
            throw new IllegalArgumentException(
                    "Status must be Active, Inactive, or Blocked"
            );
        }

        String databaseStatus =
                switch (normalizedStatus) {
                    case "ACTIVE" -> "Active";
                    case "INACTIVE" -> "Inactive";
                    case "BLOCKED" -> "Blocked";
                    default -> throw new IllegalArgumentException(
                            "Invalid status"
                    );
                };

        user.setStatus(databaseStatus);

        User savedUser =
                userRepository.save(user);

        return mapUser(savedUser);
    }

    @Transactional(readOnly = true)
    public List<StaffSummaryResponse> getAllStaff() {

        return staffRepository
                .findAllByOrderByStaffIdDesc()
                .stream()
                .map(this::mapStaff)
                .toList();
    }

    private UserSummaryResponse mapUser(
            User user
    ) {

        return new UserSummaryResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getRoleName(),
                user.getStatus(),
                user.getCreatedAt()
        );
    }

    private StaffSummaryResponse mapStaff(
            Staff staff
    ) {

        User user = staff.getUser();

        return new StaffSummaryResponse(
                staff.getStaffId(),
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                staff.getEmployeeNumber(),
                staff.getDepartment(),
                staff.getDesignation(),
                user.getRole().getRoleName(),
                user.getStatus(),
                staff.getHireDate()
        );
    }
}