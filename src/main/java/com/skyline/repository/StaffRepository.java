package com.skyline.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skyline.entity.Staff;

public interface StaffRepository extends JpaRepository<Staff, Long> {

    Optional<Staff> findByUserUserId(Long userId);

    List<Staff> findByDepartment(String department);

    List<Staff> findByDesignation(String designation);

    List<Staff> findAllByOrderByStaffIdDesc();

    boolean existsByEmployeeNumber(String employeeNumber);

}
