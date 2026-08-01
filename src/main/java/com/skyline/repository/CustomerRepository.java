package com.skyline.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skyline.entity.Customer;

public interface CustomerRepository
        extends JpaRepository<Customer, Long> {

    Optional<Customer> findByUserUserId(Long userId);

    Optional<Customer> findByNic(String nic);

    boolean existsByNic(String nic);

    boolean existsByNicAndCustomerIdNot(
            String nic,
            Long customerId
    );
}