package com.studentloan.personal.messaging;

/** Delivers outbox events to a broker. A Kafka implementation is added in Stage D. */
public interface EventPublisher {

    String destinationName();

    void publish(OutboxEvent event) throws Exception;
}
