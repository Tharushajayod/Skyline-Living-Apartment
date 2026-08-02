package com.skyline.controller;

import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class RoleTestController {

    @GetMapping("/authenticated")
    public Map<String, String> authenticatedUser() {

        return Map.of(
                "message",
                "You are authenticated"
        );
    }

    @GetMapping("/customer")
    @PreAuthorize("hasRole('CUSTOMER')")
    public Map<String, String> customerOnly() {

        return Map.of(
                "message",
                "Customer access successful"
        );
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> adminOnly() {

        return Map.of(
                "message",
                "Administrator access successful"
        );
    }

    @GetMapping("/sales-manager")
    @PreAuthorize("hasRole('SALES_MANAGER')")
    public Map<String, String> salesManagerOnly() {

        return Map.of(
                "message",
                "Sales Manager access successful"
        );
    }

    @GetMapping("/customer-relations")
    @PreAuthorize("hasRole('CUSTOMER_RELATIONS_OFFICER')")
    public Map<String, String> customerRelationsOnly() {

        return Map.of(
                "message",
                "Customer Relations Officer access successful"
        );
    }

    @GetMapping("/operations")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER')")
    public Map<String, String> operationsManagerOnly() {

        return Map.of(
                "message",
                "Operations Manager access successful"
        );
    }

    @GetMapping("/marketing")
    @PreAuthorize("hasRole('MARKETING_EXECUTIVE')")
    public Map<String, String> marketingExecutiveOnly() {

        return Map.of(
                "message",
                "Marketing Executive access successful"
        );
    }

    @GetMapping("/finance")
    @PreAuthorize("hasRole('FINANCE_OFFICER')")
    public Map<String, String> financeOfficerOnly() {

        return Map.of(
                "message",
                "Finance and Payment Officer access successful"
        );
    }
}