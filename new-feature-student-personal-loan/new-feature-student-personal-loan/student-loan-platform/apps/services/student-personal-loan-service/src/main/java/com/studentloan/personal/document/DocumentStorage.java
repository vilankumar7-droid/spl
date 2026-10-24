package com.studentloan.personal.document;

import com.studentloan.personal.config.PlatformProperties;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/** Stores files outside any public web root using generated keys. */
@Component
public class DocumentStorage {

    private final Path root;

    public DocumentStorage(PlatformProperties properties) {
        this.root = Path.of(properties.storage().documentsDir()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create document storage directory " + root, e);
        }
    }

    public void store(String storageKey, InputStream content) throws IOException {
        Files.copy(content, resolve(storageKey), StandardCopyOption.REPLACE_EXISTING);
    }

    public Resource load(String storageKey) {
        return new FileSystemResource(resolve(storageKey));
    }

    public void delete(String storageKey) {
        try {
            Files.deleteIfExists(resolve(storageKey));
        } catch (IOException ignored) {
            // Orphaned files are harmless for the demo; metadata is the source of truth.
        }
    }

    private Path resolve(String storageKey) {
        Path path = root.resolve(storageKey).normalize();
        if (!path.startsWith(root)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        return path;
    }
}
