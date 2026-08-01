package com.skyline.service;

import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skyline.dto.ChangePasswordRequest;
import com.skyline.dto.UpdateUserProfileRequest;
import com.skyline.dto.UserProfileResponse;
import com.skyline.entity.Customer;
import com.skyline.entity.User;
import com.skyline.exception.ResourceAlreadyExistsException;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.CustomerRepository;
import com.skyline.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
        UserRepository userRepository,
        CustomerRepository customerRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(
            String email
    ) {

        User user = findUserByEmail(email);

        Customer customer = customerRepository
                .findByUserUserId(user.getUserId())
                .orElse(null);

        return buildProfileResponse(user, customer);
    }

    @Transactional
    public UserProfileResponse updateCurrentUserProfile(
            String email,
            UpdateUserProfileRequest request
    ) {

        User user = findUserByEmail(email);

        Customer customer = customerRepository
                .findByUserUserId(user.getUserId())
                .orElse(null);

        user.setFullName(
                request.fullName().trim()
        );

        user.setPhone(
                normalizeOptionalValue(
                        request.phone()
                )
        );

        /*
         * Customer-specific fields are updated only when
         * this user has a customer profile.
         */
        if (customer != null) {

            String nic = normalizeOptionalValue(
                    request.nicPassportNumber()
            );

            if (nic != null
                    && customerRepository
                    .existsByNicAndCustomerIdNot(
                            nic,
                            customer.getCustomerId()
                    )) {

                throw new ResourceAlreadyExistsException(
                        "NIC or passport number is already registered"
                );
            }

            customer.setNic(nic);

            customer.setAddressLine1(
                    normalizeOptionalValue(
                            request.addressLine1()
                    )
            );

            customer.setAddressLine2(
                    normalizeOptionalValue(
                            request.addressLine2()
                    )
            );

            customer.setCity(
                    normalizeOptionalValue(
                            request.city()
                    )
            );

            customer.setCountry(
                    normalizeOptionalValue(
                            request.country()
                    )
            );

            String contactMethod =
                    normalizeOptionalValue(
                            request.preferredContactMethod()
                    );

            customer.setPreferredContactMethod(
                    contactMethod == null
                            ? null
                            : contactMethod.toUpperCase()
            );

            customerRepository.save(customer);
        }

        userRepository.save(user);

        return buildProfileResponse(
                user,
                customer
        );
    }

    private User findUserByEmail(
            String email
    ) {

        return userRepository
                .findByEmail(
                        email.trim().toLowerCase()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User account not found"
                        )
                );
    }

    private UserProfileResponse buildProfileResponse(
            User user,
            Customer customer
    ) {

        Set<String> roleNames = user.getRoles()
                .stream()
                .map(role -> role.getRoleName())
                .collect(Collectors.toSet());

        return new UserProfileResponse(
                user.getUserId(),

                customer != null
                        ? customer.getCustomerId()
                        : null,

                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getProfileImageUrl(),

                customer != null
                        ? customer.getNic()
                        : null,

                customer != null
                        ? customer.getAddressLine1()
                        : null,

                customer != null
                        ? customer.getAddressLine2()
                        : null,

                customer != null
                        ? customer.getCity()
                        : null,

                customer != null
                        ? customer.getCountry()
                        : null,

                customer != null
                        ? customer.getPreferredContactMethod()
                        : null,

                customer != null
                        ? customer.getLeadSource()
                        : null,

                user.getStatus(),
                user.isEmailVerified(),
                roleNames,
                user.getLastLoginAt(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    private String normalizeOptionalValue(
            String value
    ) {

        if (value == null
                || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }

    @Transactional
        public void changeCurrentUserPassword(
                String email,
                ChangePasswordRequest request
        ) {
        User user = findUserByEmail(email);

        if (!passwordEncoder.matches(
                request.currentPassword(),
                user.getPasswordHash()
        )) {
                throw new IllegalArgumentException(
                        "Current password is incorrect"
                );
        }

        if (!request.newPassword().equals(
                request.confirmPassword()
        )) {
                throw new IllegalArgumentException(
                        "New password and confirm password do not match"
                );
        }

        if (passwordEncoder.matches(
                request.newPassword(),
                user.getPasswordHash()
        )) {
                throw new IllegalArgumentException(
                        "New password cannot be the same as the current password"
                );
        }

        user.setPasswordHash(
                passwordEncoder.encode(
                        request.newPassword()
                )
        );

        userRepository.save(user);
        }
}