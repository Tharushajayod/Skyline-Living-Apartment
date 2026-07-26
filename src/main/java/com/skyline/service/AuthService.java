package com.skyline.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skyline.dto.LoginRequest;
import com.skyline.dto.LoginResponse;
import com.skyline.dto.RegisterRequest;
import com.skyline.dto.RegisterResponse;
import com.skyline.entity.Customer;
import com.skyline.entity.Role;
import com.skyline.entity.User;
import com.skyline.exception.ResourceAlreadyExistsException;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.CustomerRepository;
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

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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
                .findByRoleName("Customer")
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
}