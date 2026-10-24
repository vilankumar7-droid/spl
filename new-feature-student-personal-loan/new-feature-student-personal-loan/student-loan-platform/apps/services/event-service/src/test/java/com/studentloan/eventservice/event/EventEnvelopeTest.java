package com.studentloan.eventservice.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EventEnvelopeTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void parsesSharedV1EventEnvelope() throws Exception {
        var json = objectMapper.readTree("""
                {
                  "eventId": "evt-12345678-1234-1234-1234-123456789abc",
                  "eventType": "loan.application.submitted",
                  "eventVersion": 1,
                  "correlationId": null,
                  "applicationId": "PLN-2026-0001",
                  "occurredAt": "2026-10-23T12:00:00Z",
                  "data": {}
                }
                """);

        EventEnvelope envelope = EventEnvelope.from(json);

        assertEquals("loan.application.submitted", envelope.eventType());
        assertEquals("PLN-2026-0001", envelope.applicationId());
    }

    @Test
    void rejectsUnsupportedVersions() throws Exception {
        var json = objectMapper.readTree("""
                {
                  "eventId": "evt-12345678-1234-1234-1234-123456789abc",
                  "eventType": "loan.application.submitted",
                  "eventVersion": 2,
                  "correlationId": null,
                  "applicationId": "PLN-2026-0001",
                  "occurredAt": "2026-10-23T12:00:00Z",
                  "data": {}
                }
                """);

        assertThrows(IllegalArgumentException.class, () -> EventEnvelope.from(json));
    }
}
