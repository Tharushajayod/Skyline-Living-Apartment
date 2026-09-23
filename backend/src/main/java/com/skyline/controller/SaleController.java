package com.skyline.controller;

import com.skyline.dto.sale.SaleRequest;
import com.skyline.dto.sale.SaleResponse;
import com.skyline.security.UserPrincipal;
import com.skyline.service.SaleService;
import com.skyline.util.IdParser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @GetMapping
    public ResponseEntity<List<SaleResponse>> getAllSales() {
        return ResponseEntity.ok(saleService.getAllSales());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SaleResponse> getSaleById(@PathVariable String id) {
        Long numericId = IdParser.parseId(id);
        return ResponseEntity.ok(saleService.getSaleById(numericId));
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<com.skyline.dto.sale.SaleDetailsResponse> getSaleDetails(@PathVariable String id) {
        Long numericId = IdParser.parseId(id);
        return ResponseEntity.ok(saleService.getSaleDetails(numericId));
    }

    @PostMapping
    public ResponseEntity<SaleResponse> recordSale(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody SaleRequest request) {
        SaleResponse created = saleService.finalizeSale(userPrincipal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
