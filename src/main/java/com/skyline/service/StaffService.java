package com.skyline.service;

import com.skyline.dto.CreateStaffRequest;
import com.skyline.dto.StaffResponse;
import com.skyline.entity.Role;
import com.skyline.entity.Staff;
import com.skyline.entity.User;
import com.skyline.exception.ResourceAlreadyExistsException;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.RoleRepository;
import com.skyline.repository.StaffRepository;
import com.skyline.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Set;

@Service
public class StaffService {

    private static final Set<String> ALLOWED_STAFF_ROLES =
            Set.of(
                    "SALES_MANAGER",
                    "CUSTOMER_RELATIONS_OFFICER",
                    "OPERATIONS_MANAGER",
                    "MARKETING_EXECUTIVE",
                    "FINANCE_PAYMENT_OFFICER"
            );

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;

    public StaffService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            StaffRepository staffRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.staffRepository = staffRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public StaffResponse createStaff(
            CreateStaffRequest request
    ) {

        String normalizedEmail =
                request.email()
                        .trim()
                        .toLowerCase();

        String normalizedEmployeeNumber =
                request.employeeNumber()
                        .trim()
                        .toUpperCase();

        String normalizedRole =
                request.role()
                        .trim()
                        .toUpperCase()
                        .replace(" ", "_");

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ResourceAlreadyExistsException(
                    "Email address is already registered"
            );
        }

        if (staffRepository.existsByEmployeeNumber(
                normalizedEmployeeNumber
        )) {
            throw new ResourceAlreadyExistsException(
                    "Employee number is already registered"
            );
        }

        if (!ALLOWED_STAFF_ROLES.contains(normalizedRole)) {
            throw new IllegalArgumentException(
                    "Invalid staff role"
            );
        }

        Role role = roleRepository
                .findByRoleName(normalizedRole)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Selected staff role was not found"
                        )
                );

        User user = new User();

        user.setFullName(
                request.fullName().trim()
        );

        user.setEmail(normalizedEmail);

        user.setPasswordHash(
                passwordEncoder.encode(
                        request.password()
                )
        );

        user.setPhone(
                request.phone().trim()
        );

        user.setStatus("Active");
        user.setRole(role);

        User savedUser =
                userRepository.save(user);

        Staff staff = new Staff();

        staff.setUser(savedUser);

        staff.setEmployeeNumber(
                normalizedEmployeeNumber
        );

        staff.setDepartment(
                request.department().trim()
        );

        staff.setDesignation(
                request.designation().trim()
        );

        LocalDate staffHireDate =
                request.hireDate() != null
                        ? request.hireDate()
                        : LocalDate.now();

        staff.setHireDate(staffHireDate);

        Staff savedStaff =
                staffRepository.save(staff);

        return new StaffResponse(
                savedUser.getUserId(),
                savedStaff.getStaffId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedStaff.getEmployeeNumber(),
                savedStaff.getDepartment(),
                savedStaff.getDesignation(),
                savedUser.getRole().getRoleName(),
                savedUser.getStatus(),
                savedStaff.getHireDate(),
                "Staff account created successfully"
        );
    }
}