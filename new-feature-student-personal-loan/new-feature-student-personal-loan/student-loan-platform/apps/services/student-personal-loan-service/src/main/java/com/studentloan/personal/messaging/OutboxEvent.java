package com.studentloan.personal.messaging;

import jakarta.persistence.*;

import java.time.Instant;

/** Event saved in the same DB transaction as the business change (transactional outbox pattern). */
@Entity
@Table(name = "outbox_event")
public class OutboxEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, unique = true)
    private String eventId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "event_version", nullable = false)
    private int eventVersion;

    @Column(nullable = false)
    private String topic;

    @Column(name = "aggregate_id", nullable = false)
    private String aggregateId;

    @Column(name = "correlation_id")
    private String correlationId;

    @Column(nullable = false)
    private String payload;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OutboxStatus status;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "last_error")
    private String lastError;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    protected OutboxEvent() {
    }

    public OutboxEvent(String eventId, String eventType, int eventVersion, String topic, String aggregateId,
                       String correlationId, String payload, Instant occurredAt) {
        this.eventId = eventId;
        this.eventType = eventType;
        this.eventVersion = eventVersion;
        this.topic = topic;
        this.aggregateId = aggregateId;
        this.correlationId = correlationId;
        this.payload = payload;
        this.occurredAt = occurredAt;
        this.status = OutboxStatus.PENDING;
    }

    public void markPublished() {
        this.status = OutboxStatus.PUBLISHED;
        this.publishedAt = Instant.now();
        this.attempts++;
        this.lastError = null;
    }

    public void markAttemptFailed(String error, int maxAttempts) {
        this.attempts++;
        this.lastError = error == null ? "unknown" : error.substring(0, Math.min(error.length(), 500));
        if (attempts >= maxAttempts) {
            this.status = OutboxStatus.FAILED;
        }
    }

    public void retry() {
        this.status = OutboxStatus.PENDING;
        this.attempts = 0;
    }

    public Long getId() { return id; }
    public String getEventId() { return eventId; }
    public String getEventType() { return eventType; }
    public int getEventVersion() { return eventVersion; }
    public String getTopic() { return topic; }
    public String getAggregateId() { return aggregateId; }
    public String getCorrelationId() { return correlationId; }
    public String getPayload() { return payload; }
    public OutboxStatus getStatus() { return status; }
    public int getAttempts() { return attempts; }
    public String getLastError() { return lastError; }
    public Instant getOccurredAt() { return occurredAt; }
    public Instant getPublishedAt() { return publishedAt; }
}
