package com.studentloan.personal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "platform")
public record PlatformProperties(Cors cors, Storage storage, Seed seed) {

    public record Cors(List<String> allowedOrigins) {
    }

    public record Storage(String documentsDir, long maxDocumentBytes) {
    }

    public record Seed(boolean demoUsers, String demoPassword) {
    }
}
