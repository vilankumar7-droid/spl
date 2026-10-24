package com.studentloan.personal.audit;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditRepository extends JpaRepository<AuditEvent, Long> {

    List<AuditEvent> findAllByOrderByOccurredAtDesc(Pageable pageable);
}
