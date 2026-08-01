package com.skyline.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skyline.dto.ApiResponse;
import com.skyline.dto.ForgotPasswordRequest;
import com.skyline.dto.LoginRequest;
import com.skyline.dto.LoginResponse;
import com.skyline.dto.RegisterRequest;
import com.skyline.dto.RegisterResponse;
import com.skyline.dto.ResetPasswordRequest;
import com.skyline.entity.Customer;
import com.skyline.entity.PasswordResetToken;
import com.skyline.entity.Role;
import com.skyline.entity.User;
import com.skyline.exception.ResourceAlreadyExistsException;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.CustomerRepository;
import com.skyline.repository.PasswordResetTokenRepository;
import com.skyline.repository.RoleRepository;
import com.skyline.repository.UserRepository;
import com.skyline.security.JwtService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            CustomerRepository customerRepository,
            RoleRepository roleRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.roleRepository = roleRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public RegisterResponse registerCustomer(RegisterRequest request) {

        if (userRepository.existsByEmail(request.email())) {
            throw new ResourceAlreadyExistsException(
        "Email address is already registered");
        }

        if (request.nic() != null
                && !request.nic().isBlank()
                && customerRepository.existsByNic(request.nic())) {
            throw new ResourceAlreadyExistsException(
        "NIC is already registered");
        }

        Role customerRole = roleRepository
                .findByRoleName("CUSTOMER")
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                            "Customer role not found"));

        User user = new User();
        user.setRole(customerRole);
        user.setFullName(request.fullName());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone());
        user.setStatus("Active");

        User savedUser = userRepository.save(user);

        Customer customer = new Customer();
        customer.setUser(savedUser);
        customer.setNic(request.nic());
        customer.setAddress(request.address());
        customer.setCity(request.city());

        Customer savedCustomer = customerRepository.save(customer);

        return new RegisterResponse(
                savedUser.getUserId(),
                savedCustomer.getCustomerId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                customerRole.getRoleName(),
                "Customer account created successfully"
        );
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {

        String normalizedEmail =
                request.email().trim().toLowerCase();

        User user = userRepository
                .findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Invalid email or password"
                        )
                );

        if (!"Active".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException(
                    "Your account is not active"
            );
        }

        if (!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash())) {

            throw new IllegalArgumentException(
                    "Invalid email or password"
            );
        }

        String token = jwtService.generateToken(user);

        return new LoginResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().getRoleName(),
                token,
                "Bearer",
                "Login successful"
        );
    }

    @Transactional
    public ApiResponse forgotPassword(ForgotPasswordRequest request) {
    
        User user = userRepository.findByEmail(
                        request.email().trim().toLowerCase())
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));
    
        String rawToken = UUID.randomUUID().toString();
    
        PasswordResetToken token = new PasswordResetToken();
    
        token.setUser(user);
        token.setTokenHash(passwordEncoder.encode(rawToken));
        token.setExpiresAt(LocalDateTime.now().plusMinutes(30));
    
        passwordResetTokenRepository.save(token);
    
        System.out.println();
        System.out.println("======================================");
        System.out.println("PASSWORD RESET LINK");
        System.out.println("http://localhost:5173/reset-password?token=" + rawToken);
        System.out.println("======================================");
        System.out.println();
    
        return new ApiResponse(
        true,
        "Password reset link generated.",
        LocalDateTime.now()
);
    }

    @Transactional
    public ApiResponse resetPassword(ResetPasswordRequest request) {
    
        if (!request.newPassword().equals(request.confirmPassword())) {
    
            throw new IllegalArgumentException(
                    "Passwords do not match"
            );
        }
    
        PasswordResetToken token = passwordResetTokenRepository
        .findByUsedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
                LocalDateTime.now()
        )
        .stream()
        .filter(savedToken ->
                passwordEncoder.matches(
                        request.token(),
                        savedToken.getTokenHash()
                )
        )
        .findFirst()
        .orElseThrow(() ->
                new IllegalArgumentException(
                        "Invalid or expired reset token"
                )
        );
    
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
    
            throw new IllegalArgumentException(
                    "Token expired"
            );
        }
    
        if (!passwordEncoder.matches(
                request.token(),
                token.getTokenHash())) {
    
            throw new IllegalArgumentException(
                    "Invalid token"
            );
        }
    
        User user = token.getUser();
    
        user.setPasswordHash(
                passwordEncoder.encode(
                        request.newPassword()
                )
        );
    
        userRepository.save(user);
    
        token.setUsedAt(LocalDateTime.now());
    
        passwordResetTokenRepository.save(token);
    
        return new ApiResponse(
        true,
        "Password updated successfully.",
        LocalDateTime.now()
);
    }
}