package com.skyline.controller;

import java.io.IOException;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skyline.service.FileStorageService;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileStorageService fileStorageService;

    public FileController(
            FileStorageService fileStorageService
    ) {
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/{category}/{fileName:.+}")
    public ResponseEntity<Resource> getFile(
            @PathVariable String category,
            @PathVariable String fileName
    ) throws IOException {

        Resource resource =
                fileStorageService.loadFileAsResource(
                        category,
                        fileName
                );

        String contentType = "application/octet-stream";

        if (resource.getFile() != null) {
            String detectedType = java.nio.file.Files
                    .probeContentType(
                            resource.getFile().toPath()
                    );

            if (detectedType != null) {
                contentType = detectedType;
            }
        }

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType(
                                contentType
                        )
                )
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\""
                                + resource.getFilename()
                                + "\""
                )
                .body(resource);
    }
}