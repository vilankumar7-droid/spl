package com.studentloan.eventservice.audit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private final AuditRepository repository;

    public AuditService(AuditRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void record(String actor, String action, String targetType, String targetId, String details) {
        repository.save(new AuditEvent(actor, action, targetType, targetId, details));
    }
}
