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

        if (file == null || file.isEmpty()) {
            throw new FileStorageException(
                    "Cannot store an empty file"
            );
        }

        try {
            Path categoryFolder = uploadRoot
                    .resolve(category)
                    .normalize();

            if (!categoryFolder.startsWith(uploadRoot)) {
                throw new FileStorageException(
                        "Invalid upload category"
                );
            }

            Files.createDirectories(categoryFolder);

            String originalName = file.getOriginalFilename();

            if (originalName == null || originalName.isBlank()) {
                originalName = "file";
            }

            // Remove path parts, quotes and unsafe characters
            originalName = Paths.get(originalName)
                    .getFileName()
                    .toString()
                    .replace("\"", "")
                    .replace("'", "")
                    .trim();

            String extension = "";

            int dotIndex = originalName.lastIndexOf('.');

            if (dotIndex >= 0
                    && dotIndex < originalName.length() - 1) {

                extension = originalName
                        .substring(dotIndex)
                        .toLowerCase()
                        .replaceAll("[^a-z0-9.]", "");
            }

            String generatedFileName =
                    UUID.randomUUID() + extension;

            Path target = categoryFolder
                    .resolve(generatedFileName)
                    .normalize();

            if (!target.startsWith(categoryFolder)) {
                throw new FileStorageException(
                        "Invalid target file path"
                );
            }

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
            String cleanCategory = category
                    .replace("\"", "")
                    .replace("'", "")
                    .trim();

            String cleanFileName = fileName
                    .replace("\"", "")
                    .replace("'", "")
                    .trim();

            Path categoryFolder = uploadRoot
                    .resolve(cleanCategory)
                    .normalize();

            Path filePath = categoryFolder
                    .resolve(cleanFileName)
                    .normalize();

            if (!filePath.startsWith(categoryFolder)) {
                throw new FileNotFoundException(
                        "Invalid file path"
                );
            }

            Resource resource = new UrlResource(
                    filePath.toUri()
            );

            if (resource.exists() && resource.isReadable()) {
                return resource;
            }

            throw new FileNotFoundException(
                    "File not found: " + cleanFileName
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