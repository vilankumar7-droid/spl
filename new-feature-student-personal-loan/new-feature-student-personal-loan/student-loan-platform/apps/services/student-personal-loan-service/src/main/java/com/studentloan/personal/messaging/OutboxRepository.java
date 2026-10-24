package com.studentloan.personal.messaging;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OutboxRepository extends JpaRepository<OutboxEvent, Long> {

    List<OutboxEvent> findByStatusOrderByIdAsc(OutboxStatus status, Pageable pageable);

    List<OutboxEvent> findAllByOrderByIdDesc(Pageable pageable);

    List<OutboxEvent> findByAggregateIdOrderByIdAsc(String aggregateId);

    long countByStatus(OutboxStatus status);
}
