package com.skyline.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    String storeFile(
            MultipartFile file,
            String category
    );

    Resource loadFileAsResource(
            String category,
            String fileName
    );

    void deleteFile(
            String category,
            String fileName
    );
}