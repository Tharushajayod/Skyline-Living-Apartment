package com.skyline.controller;

import java.io.IOException;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.PaymentEvidenceRepository;
import com.skyline.service.FileStorageService;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileStorageService
            fileStorageService;

    private final PaymentEvidenceRepository
            paymentEvidenceRepository;

    public FileController(
            FileStorageService fileStorageService,
            PaymentEvidenceRepository paymentEvidenceRepository
    ) {

        this.fileStorageService =
                fileStorageService;

        this.paymentEvidenceRepository =
                paymentEvidenceRepository;
    }

    @GetMapping("/{category}/{fileName:.+}")
    public ResponseEntity<Resource> getFile(

            @PathVariable
            String category,

            @PathVariable
            String fileName,

            Authentication authentication

    ) throws IOException {

        /*
         * Payment evidence files require
         * additional authorization.
         */
        if ("payment-evidence"
                .equalsIgnoreCase(category)) {

            authorizePaymentEvidence(
                    fileName,
                    authentication
            );
        }

        Resource resource =
                fileStorageService
                        .loadFileAsResource(
                                category,
                                fileName
                        );

        String contentType =
                "application/octet-stream";

        try {

            String detectedType =
                    java.nio.file.Files
                            .probeContentType(
                                    resource
                                            .getFile()
                                            .toPath()
                            );

            if (detectedType != null
                    && !detectedType
                            .isBlank()) {

                contentType =
                        detectedType;
            }

        } catch (Exception exception) {

            /*
             * MIME detection failure should not
             * prevent the file from being returned.
             */
            contentType =
                    "application/octet-stream";
        }

        String responseFileName =
                resource.getFilename() != null
                        ? resource.getFilename()
                        : fileName;

        return ResponseEntity
                .ok()
                .contentType(
                        MediaType
                                .parseMediaType(
                                        contentType
                                )
                )
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,

                        "inline; filename=\""
                                + responseFileName
                                + "\""
                )
                .body(resource);
    }

    /* =====================================================
       PAYMENT EVIDENCE AUTHORIZATION
    ====================================================== */

    private void authorizePaymentEvidence(

            String fileName,

            Authentication authentication
    ) {

        /* -------------------------
           Authentication check
        ------------------------- */

        if (authentication == null
                || !authentication
                        .isAuthenticated()
                || "anonymousUser"
                        .equals(
                                authentication
                                        .getPrincipal()
                        )) {

            throw new AccessDeniedException(
                    "Authentication is required"
            );
        }

        /*
         * This must match the value saved by
         * PaymentEvidenceServiceImpl:
         *
         * /api/files/payment-evidence/<storedFile>
         */
        String fileUrl =
                "/api/files/payment-evidence/"
                        + fileName;

        /* -------------------------
           File metadata existence
        ------------------------- */

        if (!paymentEvidenceRepository
                .existsByFileUrl(
                        fileUrl
                )) {

            throw new ResourceNotFoundException(
                    "Payment evidence not found"
            );
        }

        /* -------------------------
           ADMIN
        ------------------------- */

        if (hasAuthority(
                authentication,
                "ROLE_ADMIN"
        )) {
            return;
        }

        /* -------------------------
           FINANCE OFFICER
        ------------------------- */

        if (hasAuthority(
                authentication,
                "ROLE_FINANCE_OFFICER"
        )) {
            return;
        }

        /* -------------------------
           CUSTOMER
        ------------------------- */

        if (hasAuthority(
                authentication,
                "ROLE_CUSTOMER"
        )) {

            String email =
                    authentication
                            .getName()
                            .trim()
                            .toLowerCase();

            boolean ownsEvidence =
                    paymentEvidenceRepository
                            .existsByFileUrlAndPaymentCustomerUserEmail(
                                    fileUrl,
                                    email
                            );

            if (ownsEvidence) {
                return;
            }

            throw new AccessDeniedException(
                    "You are not allowed to view this payment evidence"
            );
        }

        /* -------------------------
           Any other staff role
        ------------------------- */

        throw new AccessDeniedException(
                "You are not allowed to view payment evidence"
        );
    }

    /* =====================================================
       AUTHORITY HELPER
    ====================================================== */

    private boolean hasAuthority(

            Authentication authentication,

            String authority
    ) {

        return authentication
                .getAuthorities()
                .stream()
                .anyMatch(grantedAuthority ->
                        authority.equals(
                                grantedAuthority
                                        .getAuthority()
                        )
                );
    }
}