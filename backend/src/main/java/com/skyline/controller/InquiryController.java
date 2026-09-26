package com.skyline.controller;

import com.skyline.dto.inquiry.InquiryReplyRequest;
import com.skyline.dto.inquiry.InquiryRequest;
import com.skyline.dto.inquiry.InquiryResponse;
import com.skyline.enums.InquiryPriority;
import com.skyline.enums.InquiryStatus;
import com.skyline.security.UserPrincipal;
import com.skyline.service.InquiryService;
import com.skyline.util.IdParser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inquiries")
public class InquiryController {

    private final InquiryService inquiryService;

    public InquiryController(InquiryService inquiryService) {
        this.inquiryService = inquiryService;
    }

    @GetMapping
    public ResponseEntity<List<InquiryResponse>> getInquiries(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false, name = "customer") String customerParam) {
        List<InquiryResponse> inquiries = inquiryService.getInquiries(userPrincipal, customerParam);
        return ResponseEntity.ok(inquiries);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InquiryResponse> getInquiryById(@PathVariable String id) {
        Long numericId = IdParser.parseId(id);
        return ResponseEntity.ok(inquiryService.getInquiryById(numericId));
    }

    @PostMapping
    public ResponseEntity<InquiryResponse> createInquiry(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody InquiryRequest request) {
        InquiryResponse created = inquiryService.createInquiry(userPrincipal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/replies")
    public ResponseEntity<InquiryResponse> addReply(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody InquiryReplyRequest request) {
        Long numericId = IdParser.parseId(id);
        InquiryResponse updated = inquiryService.addReply(numericId, request, userPrincipal);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<InquiryResponse> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        Long numericId = IdParser.parseId(id);
        InquiryStatus status = InquiryStatus.fromString(payload.get("status"));
        return ResponseEntity.ok(inquiryService.updateStatus(numericId, status));
    }

    @PatchMapping("/{id}/priority")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<InquiryResponse> updatePriority(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        Long numericId = IdParser.parseId(id);
        InquiryPriority priority = InquiryPriority.fromString(payload.get("priority"));
        return ResponseEntity.ok(inquiryService.updatePriority(numericId, priority));
    }
}
