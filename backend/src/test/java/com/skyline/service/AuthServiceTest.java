package com.skyline.service;

import com.skyline.dto.auth.AuthResponse;
import com.skyline.dto.auth.RegisterRequest;
import com.skyline.entity.User;
import com.skyline.enums.UserRole;
import com.skyline.enums.UserStatus;
import com.skyline.exception.ConflictException;
import com.skyline.repository.UserRepository;
import com.skyline.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, authenticationManager, jwtTokenProvider);
    }

    @Test
    void testRegisterDuplicateEmailRejected() {
        RegisterRequest request = new RegisterRequest("Test User", "test@email.com", "password123", "123456");
        when(userRepository.existsByEmail("test@email.com")).thenReturn(true);

        assertThrows(ConflictException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testRegisterPasswordStoredHashed() {
        RegisterRequest request = new RegisterRequest("New Customer", "new@email.com", "plainPassword", "123456");
        when(userRepository.existsByEmail("new@email.com")).thenReturn(false);
        when(passwordEncoder.encode("plainPassword")).thenReturn("$2a$10$HashedEncodedPassword");

        User savedUser = User.builder()
                .id(1L)
                .name("New Customer")
                .email("new@email.com")
                .password("$2a$10$HashedEncodedPassword")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtTokenProvider.generateTokenFromEmail(anyString(), any(), anyString())).thenReturn("mock.jwt.token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getToken());
        assertEquals("new@email.com", response.getUser().getEmail());
        verify(passwordEncoder).encode("plainPassword");
        verify(userRepository).save(argThat(user -> user.getPassword().equals("$2a$10$HashedEncodedPassword")));
    }
}
