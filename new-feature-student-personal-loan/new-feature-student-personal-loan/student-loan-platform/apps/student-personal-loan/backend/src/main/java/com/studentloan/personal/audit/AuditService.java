package com.studentloan.personal.audit;

import com.studentloan.personal.common.correlation.CorrelationIdFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditRepository repository;

    public AuditService(AuditRepository repository) {
        this.repository = repository;
    }

    /** Audit records are written even if the surrounding business transaction later fails (e.g. failed logins). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String actor, String action, String targetType, String targetId, String details) {
        repository.save(new AuditEvent(actor, action, targetType, targetId, details, CorrelationIdFilter.current()));
        log.info("audit action={} targetType={} targetId={}", action, targetType, targetId);
    }
}
