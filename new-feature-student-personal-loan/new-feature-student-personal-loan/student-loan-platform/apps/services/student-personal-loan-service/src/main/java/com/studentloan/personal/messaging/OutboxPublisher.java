package com.studentloan.personal.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Polls pending outbox events and hands them to the configured publisher, with bounded retries. */
@Component
public class OutboxPublisher {

    static final int MAX_ATTEMPTS = 5;
    private static final Logger log = LoggerFactory.getLogger(OutboxPublisher.class);

    private final OutboxRepository repository;
    private final EventPublisher publisher;

    public OutboxPublisher(OutboxRepository repository, EventPublisher publisher) {
        this.repository = repository;
        this.publisher = publisher;
    }

    @Scheduled(fixedDelayString = "${platform.outbox.publish-interval-ms:5000}")
    @Transactional
    public void publishPending() {
        for (OutboxEvent event : repository.findByStatusOrderByIdAsc(OutboxStatus.PENDING, PageRequest.of(0, 50))) {
            try {
                publisher.publish(event);
                event.markPublished();
            } catch (Exception ex) {
                log.warn("Failed to publish event {} (attempt {})", event.getEventId(), event.getAttempts() + 1, ex);
                event.markAttemptFailed(ex.getMessage(), MAX_ATTEMPTS);
            }
        }
    }
}
