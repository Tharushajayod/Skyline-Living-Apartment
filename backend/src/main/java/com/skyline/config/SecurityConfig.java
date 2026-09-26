package com.skyline.config;

import com.skyline.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig
    ) throws Exception {

        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                .csrf(AbstractHttpConfigurer::disable)

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // ==========================================
                        // PREFLIGHT
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // ==========================================
                        // PUBLIC
                        // ==========================================

                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/apartments/**"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reviews",
                                "/api/reviews/**"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/uploads/**"
                        ).permitAll()

                        .requestMatchers(
                                "/error"
                        ).permitAll()

                        // ==========================================
                        // PAYMENT PLANS
                        //
                        // Customer:
                        // GET plans
                        // GET plan
                        // POST request
                        //
                        // Admin / Staff:
                        // GET
                        // POST
                        // approve / reject controlled by
                        // @PreAuthorize in controller
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/payment-plans",
                                "/api/payment-plans/**"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/payment-plans"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/payment-plans/**"
                        ).authenticated()

                        // ==========================================
                        // PAYMENTS
                        // ==========================================

                        .requestMatchers(
                                "/api/payments/**"
                        ).authenticated()

                        // ==========================================
                        // EVERYTHING ELSE
                        // ==========================================

                        .anyRequest()
                        .authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                Arrays.asList(
                        "http://localhost:5173",
                        "http://127.0.0.1:5173",
                        "http://localhost:3000"
                )
        );

        configuration.setAllowedMethods(
                Arrays.asList(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                Arrays.asList(
                        "Authorization",
                        "Content-Type",
                        "Accept",
                        "X-Requested-With",
                        "Origin",
                        "Access-Control-Request-Method",
                        "Access-Control-Request-Headers"
                )
        );

        configuration.setExposedHeaders(
                Collections.singletonList(
                        "Authorization"
                )
        );

        configuration.setAllowCredentials(true);

        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}