package com.studentloan.eventservice.outbox;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class KafkaEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public KafkaEventPublisher(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publish(OutboxEvent event) throws Exception {
        kafkaTemplate.send(event.getTopic(), event.getApplicationId(), event.getPayload())
                .get(10, TimeUnit.SECONDS);
    }
}
