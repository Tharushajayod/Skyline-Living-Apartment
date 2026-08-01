package com.skyline.service;

import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
    private final FileStorageService fileStorageService;

    public UserService(
        UserRepository userRepository,
        CustomerRepository customerRepository,
        PasswordEncoder passwordEncoder,
        FileStorageService fileStorageService

    ) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.fileStorageService = fileStorageService;
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

        @Transactional
        public UserProfileResponse updateProfileImage(
                String email,
                MultipartFile file
        ) {

        User user = findUserByEmail(email);

        validateProfileImage(file);

        String oldImageUrl = user.getProfileImageUrl();

        String fileName = fileStorageService.storeFile(
                file,
                "profile-images"
        );

        String imageUrl =
                "/api/files/profile-images/" + fileName;

        user.setProfileImageUrl(imageUrl);
        userRepository.save(user);

        if (oldImageUrl != null
                && oldImageUrl.startsWith(
                        "/api/files/profile-images/"
                )) {

                String oldFileName = oldImageUrl.substring(
                        oldImageUrl.lastIndexOf("/") + 1
                );

                fileStorageService.deleteFile(
                        "profile-images",
                        oldFileName
                );
        }

        Customer customer = customerRepository
                .findByUserUserId(user.getUserId())
                .orElse(null);

        return buildProfileResponse(user, customer);
        }

        private void validateProfileImage(
                MultipartFile file
        ) {
                System.out.println("Content Type = " + file.getContentType());
                System.out.println("Original Name = " + file.getOriginalFilename());

        if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException(
                        "Profile image is required"
                );
        }

        String contentType = file.getContentType();

        String fileName = file.getOriginalFilename();

        if (fileName == null ||
        !(fileName.toLowerCase().endsWith(".jpg")
        || fileName.toLowerCase().endsWith(".jpeg")
        || fileName.toLowerCase().endsWith(".png")
        || fileName.toLowerCase().endsWith(".gif")
        || fileName.toLowerCase().endsWith(".webp"))) {

                throw new IllegalArgumentException(
                "Only image files are allowed"
        );
        }

        long maxSize = 5 * 1024 * 1024;

        if (file.getSize() > maxSize) {
                throw new IllegalArgumentException(
                        "Profile image cannot exceed 5 MB"
                );
        }
        }

        @Transactional
        public void deactivateCurrentUserAccount(String email) {

        User user = findUserByEmail(email);

        if ("DEACTIVATED".equalsIgnoreCase(user.getStatus())) {
                throw new IllegalArgumentException(
                        "Account is already deactivated"
                );
        }

        user.setStatus("DEACTIVATED");
        userRepository.save(user);
        }

        @Transactional
        public UserProfileResponse removeProfileImage(String email) {

        User user = findUserByEmail(email);

        String currentImageUrl = user.getProfileImageUrl();

        if (currentImageUrl == null || currentImageUrl.isBlank()) {
                throw new IllegalArgumentException(
                        "Profile image is not set"
                );
        }

        if (currentImageUrl.startsWith(
                "/api/files/profile-images/"
        )) {

                String fileName = currentImageUrl.substring(
                        currentImageUrl.lastIndexOf("/") + 1
                );

                fileStorageService.deleteFile(
                        "profile-images",
                        fileName
                );
        }

        user.setProfileImageUrl(null);
        userRepository.save(user);

        Customer customer = customerRepository
                .findByUserUserId(user.getUserId())
                .orElse(null);

        return buildProfileResponse(
                user,
                customer
        );
        }
}