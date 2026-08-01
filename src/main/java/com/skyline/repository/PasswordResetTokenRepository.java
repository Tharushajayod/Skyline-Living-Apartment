package com.skyline.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skyline.entity.PasswordResetToken;

public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {

    List<PasswordResetToken>
    findByUsedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
            LocalDateTime currentTime
    );

    List<PasswordResetToken>
    findByUserUserIdAndUsedAtIsNull(
            Long userId
    );

    void deleteByUserUserId(Long userId);
}