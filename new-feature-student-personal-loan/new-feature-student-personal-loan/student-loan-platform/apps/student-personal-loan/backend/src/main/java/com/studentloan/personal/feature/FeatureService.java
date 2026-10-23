package com.studentloan.personal.feature;

import com.studentloan.personal.common.exception.ApiException;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

/** Server-side feature toggles read from configuration (platform.features.*). The browser can only read them. */
@Service
public class FeatureService {

    private final Environment environment;

    public FeatureService(Environment environment) {
        this.environment = environment;
    }

    public record FeatureStatus(String key, String label, String description, String stage, boolean enabled) {
    }

    public boolean isEnabled(Feature feature) {
        return environment.getProperty("platform.features." + feature.key(), Boolean.class, false);
    }

    public void require(Feature feature) {
        if (!isEnabled(feature)) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "FEATURE_DISABLED",
                    feature.label() + " is not enabled in this environment");
        }
    }

    public List<FeatureStatus> all() {
        return Arrays.stream(Feature.values())
                .map(f -> new FeatureStatus(f.key(), f.label(), f.description(), f.stage(), isEnabled(f)))
                .toList();
    }
}
