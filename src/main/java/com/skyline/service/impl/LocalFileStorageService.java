package com.skyline.service.impl;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.skyline.exception.FileNotFoundException;
import com.skyline.exception.FileStorageException;
import com.skyline.service.FileStorageService;

@Service
public class LocalFileStorageService
        implements FileStorageService {

    private final Path uploadRoot;

    public LocalFileStorageService(

            @Value("${file.upload-dir}")
            String uploadDirectory

    ) {

        this.uploadRoot = Paths.get(uploadDirectory)
                .toAbsolutePath()
                .normalize();

        try {

            Files.createDirectories(uploadRoot);

        } catch (IOException ex) {

            throw new FileStorageException(
                    "Could not create upload directory",
                    ex
            );
        }
    }

    @Override
    public String storeFile(

            MultipartFile file,
            String category

    ) {

        try {

            Path categoryFolder =
                    uploadRoot.resolve(category);

            Files.createDirectories(categoryFolder);

            String originalName =
                    file.getOriginalFilename();

            String extension = "";

            if (originalName != null
                    && originalName.contains(".")) {

                extension = originalName.substring(
                        originalName.lastIndexOf(".")
                );
            }

            String generatedFileName =
                    UUID.randomUUID() + extension;

            Path target =
                    categoryFolder.resolve(
                            generatedFileName
                    );

            Files.copy(

                    file.getInputStream(),
                    target,
                    StandardCopyOption.REPLACE_EXISTING

            );

            return generatedFileName;

        } catch (IOException ex) {

            throw new FileStorageException(
                    "Failed to store file",
                    ex
            );
        }
    }

    @Override
    public Resource loadFileAsResource(

            String category,
            String fileName

    ) {

        try {

            Path filePath =
                    uploadRoot
                            .resolve(category)
                            .resolve(fileName)
                            .normalize();

            Resource resource =
                    new UrlResource(
                            filePath.toUri()
                    );

            if (resource.exists()) {

                return resource;
            }

            throw new FileNotFoundException(
                    "File not found"
            );

        } catch (MalformedURLException ex) {

            throw new FileNotFoundException(
                    "File not found",
                    ex
            );
        }
    }

    @Override
    public void deleteFile(

            String category,
            String fileName

    ) {

        try {

            Files.deleteIfExists(

                    uploadRoot
                            .resolve(category)
                            .resolve(fileName)

            );

        } catch (IOException ex) {

            throw new FileStorageException(
                    "Could not delete file",
                    ex
            );
        }
    }

}