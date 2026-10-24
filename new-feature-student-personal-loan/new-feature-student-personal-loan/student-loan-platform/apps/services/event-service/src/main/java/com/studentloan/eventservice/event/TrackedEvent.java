package com.studentloan.eventservice.event;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "tracked_event")
public class TrackedEvent {

    @Id
    @Column(name = "event_id", length = 40)
    private String eventId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "event_version", nullable = false)
    private int eventVersion;

    @Column(nullable = false, length = 100)
    private String topic;

    @Column(name = "application_id", nullable = false, length = 40)
    private String applicationId;

    @Column(name = "correlation_id", length = 64)
    private String correlationId;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "received_at", nullable = false)
    private Instant receivedAt;

    @Column(nullable = false, columnDefinition = "text")
    private String payload;

    protected TrackedEvent() {
    }

    public TrackedEvent(String eventId, String eventType, int eventVersion, String topic, String applicationId,
                        String correlationId, Instant occurredAt, Instant receivedAt, String payload) {
        this.eventId = eventId;
        this.eventType = eventType;
        this.eventVersion = eventVersion;
        this.topic = topic;
        this.applicationId = applicationId;
        this.correlationId = correlationId;
        this.occurredAt = occurredAt;
        this.receivedAt = receivedAt;
        this.payload = payload;
    }

    public String getEventId() { return eventId; }
    public String getEventType() { return eventType; }
    public int getEventVersion() { return eventVersion; }
    public String getTopic() { return topic; }
    public String getApplicationId() { return applicationId; }
    public String getCorrelationId() { return correlationId; }
    public Instant getOccurredAt() { return occurredAt; }
    public Instant getReceivedAt() { return receivedAt; }
    public String getPayload() { return payload; }
}
