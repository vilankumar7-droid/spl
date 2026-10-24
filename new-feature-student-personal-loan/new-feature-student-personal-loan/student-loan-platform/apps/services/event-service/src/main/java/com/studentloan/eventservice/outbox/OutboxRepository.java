package com.studentloan.eventservice.outbox;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OutboxRepository extends JpaRepository<OutboxEvent, Long> {

    long countByStatus(OutboxStatus status);

    List<OutboxEvent> findAllByOrderByIdDesc(Pageable pageable);

    Optional<OutboxEvent> findByEventId(String eventId);
}
