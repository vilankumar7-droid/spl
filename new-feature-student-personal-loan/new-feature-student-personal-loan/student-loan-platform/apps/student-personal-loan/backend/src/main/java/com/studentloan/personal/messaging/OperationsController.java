package com.studentloan.personal.messaging;

import com.studentloan.personal.audit.AuditEvent;
import com.studentloan.personal.audit.AuditRepository;
import com.studentloan.personal.audit.AuditService;
import com.studentloan.personal.auth.CurrentUser;
import com.studentloan.personal.common.exception.ApiException;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

/** Event operations dashboard API: outbox events, publishing status and the audit trail. */
@RestController
@RequestMapping("/api/v1/operations")
@PreAuthorize("hasAnyRole('REVIEWER','ADMIN')")
public class OperationsController {

    public record EventView(String eventId, String eventType, int eventVersion, String topic, String applicationId,
                            String correlationId, OutboxStatus status, int attempts, String lastError,
                            Instant occurredAt, Instant publishedAt, String payload) {
    }

    public record OperationsSummary(long total, long pending, long published, long failed, String destination) {
    }

    private final OutboxRepository outbox;
    private final AuditRepository auditRepository;
    private final AuditService auditService;
    private final EventPublisher publisher;

    public OperationsController(OutboxRepository outbox, AuditRepository auditRepository, AuditService auditService,
                                EventPublisher publisher) {
        this.outbox = outbox;
        this.auditRepository = auditRepository;
        this.auditService = auditService;
        this.publisher = publisher;
    }

    @GetMapping("/summary")
    public OperationsSummary summary() {
        return new OperationsSummary(outbox.count(), outbox.countByStatus(OutboxStatus.PENDING),
                outbox.countByStatus(OutboxStatus.PUBLISHED), outbox.countByStatus(OutboxStatus.FAILED),
                publisher.destinationName());
    }

    @GetMapping("/events")
    public List<EventView> events(@RequestParam(defaultValue = "200") int limit) {
        return outbox.findAllByOrderByIdDesc(PageRequest.of(0, Math.min(Math.max(limit, 1), 500))).stream()
                .map(OperationsController::view).toList();
    }

    @PostMapping("/events/{eventId}/retry")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public EventView retry(@PathVariable String eventId) {
        OutboxEvent event = outbox.findAll().stream().filter(e -> e.getEventId().equals(eventId)).findFirst()
                .orElseThrow(() -> ApiException.notFound("Event"));
        if (event.getStatus() != OutboxStatus.FAILED) {
            throw ApiException.conflict("NOT_FAILED", "Only failed events can be retried");
        }
        event.retry();
        auditService.record(CurrentUser.get().email(), "EVENT_RETRIED", "OutboxEvent", eventId, null);
        return view(event);
    }

    @GetMapping("/audit")
    public List<AuditEvent> audit(@RequestParam(defaultValue = "100") int limit) {
        return auditRepository.findAllByOrderByOccurredAtDesc(PageRequest.of(0, Math.min(Math.max(limit, 1), 500)));
    }

    private static EventView view(OutboxEvent e) {
        return new EventView(e.getEventId(), e.getEventType(), e.getEventVersion(), e.getTopic(), e.getAggregateId(),
                e.getCorrelationId(), e.getStatus(), e.getAttempts(), e.getLastError(), e.getOccurredAt(),
                e.getPublishedAt(), e.getPayload());
    }
}
