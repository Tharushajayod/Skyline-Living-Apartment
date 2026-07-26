package com.skyline.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skyline.entity.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByUserUserIdOrderByActionDateDesc(Long userId);

    List<AuditLog> findAllByOrderByActionDateDesc();

    List<AuditLog> findByAction(String action);
}