package com.skyline.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skyline.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByStatus(String status);

    List<User> findByRoleRoleName(String roleName);

    List<User> findAllByOrderByCreatedAtDesc();

    long countByRoleRoleName(String roleName);

    long countByStatus(String status);
}