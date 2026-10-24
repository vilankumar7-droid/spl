package com.studentloan.personal.messaging;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
@ConditionalOnProperty(prefix = "platform.features", name = "kafka-event-tracking", havingValue = "true")
public class KafkaEventPublisher implements EventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public KafkaEventPublisher(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @Override
    public String destinationName() {
        return "kafka";
    }

    @Override
    public void publish(OutboxEvent event) throws Exception {
        kafkaTemplate.send(event.getTopic(), event.getAggregateId(), event.getPayload())
                .get(10, TimeUnit.SECONDS);
    }
}