package com.studentloan.personal.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studentloan.personal.common.correlation.CorrelationIdFilter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class OutboxService {

    private final OutboxRepository repository;
    private final ObjectMapper objectMapper;

    public OutboxService(OutboxRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    /**
     * Records an event using the shared envelope (eventId, eventType, eventVersion, correlationId, occurredAt,
     * applicationId). Must join the caller's transaction so the event is saved atomically with the change.
     * Never put tokens, passwords or document contents in the data map.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public OutboxEvent record(String eventType, String topic, String applicationId, Map<String, Object> data) {
        String eventId = "evt-" + UUID.randomUUID();
        Instant now = Instant.now();
        String correlationId = CorrelationIdFilter.current();
        Map<String, Object> envelope = new LinkedHashMap<>();
        envelope.put("eventId", eventId);
        envelope.put("eventType", eventType);
        envelope.put("eventVersion", 1);
        envelope.put("correlationId", correlationId);
        envelope.put("applicationId", applicationId);
        envelope.put("occurredAt", now.toString());
        envelope.put("data", data);
        try {
            String payload = objectMapper.writeValueAsString(envelope);
            return repository.save(new OutboxEvent(eventId, eventType, 1, topic, applicationId, correlationId,
                    payload, now));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not serialise event " + eventType, e);
        }
    }
}
