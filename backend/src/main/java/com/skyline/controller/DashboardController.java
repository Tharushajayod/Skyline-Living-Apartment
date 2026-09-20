package com.skyline.controller;

import com.skyline.dto.dashboard.DashboardStatsResponse;
import com.skyline.dto.dashboard.ReportDataResponse;
import com.skyline.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }

    @GetMapping("/reports")
    public ResponseEntity<ReportDataResponse> getDashboardReports() {
        return ResponseEntity.ok(dashboardService.getReports());
    }
}
