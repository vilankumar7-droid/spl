package com.studentloan.personal.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

/** Default publisher until Kafka is enabled: writes the event to the structured log. */
@Component
@ConditionalOnMissingBean(value = EventPublisher.class, ignored = LoggingEventPublisher.class)
public class LoggingEventPublisher implements EventPublisher {

    private static final Logger log = LoggerFactory.getLogger(LoggingEventPublisher.class);

    @Override
    public String destinationName() {
        return "log";
    }

    @Override
    public void publish(OutboxEvent event) {
        log.info("event published topic={} eventType={} eventId={} applicationId={}",
                event.getTopic(), event.getEventType(), event.getEventId(), event.getAggregateId());
    }
}
