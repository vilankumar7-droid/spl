package com.studentloan.eventservice.event;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
public class EventConsumer {

    private static final Logger log = LoggerFactory.getLogger(EventConsumer.class);
    private final ObjectMapper objectMapper;
    private final TrackedEventRepository events;

    public EventConsumer(ObjectMapper objectMapper, TrackedEventRepository events) {
        this.objectMapper = objectMapper;
        this.events = events;
    }

    @KafkaListener(topics = "#{'${platform.kafka.topics}'.split(',')}")
    @Transactional
    public void consume(@Header(KafkaHeaders.RECEIVED_TOPIC) String topic, @Payload String payload) {
        try {
            JsonNode json = objectMapper.readTree(payload);
            EventEnvelope envelope = EventEnvelope.from(json);
            if (!events.existsById(envelope.eventId())) {
                events.save(new TrackedEvent(envelope.eventId(), envelope.eventType(), envelope.eventVersion(),
                        topic, envelope.applicationId(), envelope.correlationId(), envelope.occurredAt(),
                        Instant.now(), payload));
                log.info("Tracked Kafka event eventId={} eventType={} topic={}",
                        envelope.eventId(), envelope.eventType(), topic);
            }
        } catch (JsonProcessingException | IllegalArgumentException ex) {
            log.error("Rejected invalid event from topic {}: {}", topic, ex.getMessage(), ex);
            throw new IllegalArgumentException("Invalid event envelope received from Kafka", ex);
        }
    }
}
