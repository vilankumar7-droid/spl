package com.studentloan.eventservice.event;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Set;

public record EventEnvelope(String eventId, String eventType, int eventVersion, String applicationId,
                            Instant occurredAt, String correlationId) {

    private static final Set<String> FIELDS = Set.of(
            "eventId", "eventType", "eventVersion", "correlationId", "applicationId", "occurredAt", "data");

    public static EventEnvelope from(JsonNode json) {
        if (!json.isObject()
                || !json.path("eventId").isTextual()
                || !json.path("eventType").isTextual()
                || !json.path("applicationId").isTextual()
                || !json.path("occurredAt").isTextual()
                || !json.path("eventVersion").canConvertToInt()
                || json.path("eventVersion").intValue() != 1
                || !json.has("correlationId")
                || !json.path("data").isObject()) {
            throw new IllegalArgumentException("Kafka message does not match event envelope v1");
        }
        json.fieldNames().forEachRemaining(field -> {
            if (!FIELDS.contains(field)) {
                throw new IllegalArgumentException("Unexpected event envelope field: " + field);
            }
        });
        String eventId = json.path("eventId").textValue();
        String eventType = json.path("eventType").textValue();
        String applicationId = json.path("applicationId").textValue();
        JsonNode correlationId = json.get("correlationId");
        if (!eventId.matches("^evt-[0-9a-f-]{36}$")
                || eventType.isBlank()
                || applicationId.isBlank()
                || (correlationId != null && !correlationId.isNull()
                    && (!correlationId.isTextual() || correlationId.textValue().length() > 64))) {
            throw new IllegalArgumentException("Kafka message does not match event envelope v1");
        }
        try {
            return new EventEnvelope(eventId, eventType, 1, applicationId,
                    Instant.parse(json.path("occurredAt").textValue()),
                    correlationId != null && correlationId.isTextual() ? correlationId.textValue() : null);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Kafka message has an invalid occurredAt timestamp", ex);
        }
    }
}
