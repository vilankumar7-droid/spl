package com.studentloan.eventservice.operations;

import com.studentloan.eventservice.audit.AuditEvent;
import com.studentloan.eventservice.audit.AuditRepository;
import com.studentloan.eventservice.audit.AuditService;
import com.studentloan.eventservice.event.TrackedEvent;
import com.studentloan.eventservice.event.TrackedEventRepository;
import com.studentloan.eventservice.outbox.KafkaEventPublisher;
import com.studentloan.eventservice.outbox.OutboxEvent;
import com.studentloan.eventservice.outbox.OutboxRepository;
import com.studentloan.eventservice.outbox.OutboxStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

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
    private final TrackedEventRepository trackedEvents;
    private final KafkaEventPublisher publisher;
    private final String destination;

    public OperationsController(OutboxRepository outbox, AuditRepository auditRepository, AuditService auditService,
                                TrackedEventRepository trackedEvents, KafkaEventPublisher publisher,
                                @Value("${platform.outbox.destination}") boolean destinationEnabled) {
        this.outbox = outbox;
        this.auditRepository = auditRepository;
        this.auditService = auditService;
        this.trackedEvents = trackedEvents;
        this.publisher = publisher;
        this.destination = destinationEnabled ? "kafka" : "log";
    }

    @GetMapping("/summary")
    public OperationsSummary summary() {
        return new OperationsSummary(outbox.count(), outbox.countByStatus(OutboxStatus.PENDING),
                outbox.countByStatus(OutboxStatus.PUBLISHED), outbox.countByStatus(OutboxStatus.FAILED), destination);
    }

    @GetMapping("/events")
    public List<EventView> events(@RequestParam(defaultValue = "200") int limit) {
        return outbox.findAllByOrderByIdDesc(PageRequest.of(0, bounded(limit)))
                .stream().map(OperationsController::view).toList();
    }

    @PostMapping("/events/{eventId}/retry")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public EventView retry(@PathVariable String eventId) {
        OutboxEvent event = outbox.findByEventId(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        if (event.getStatus() != OutboxStatus.FAILED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only failed events can be retried");
        }
        event.retry();
        try {
            publisher.publish(event);
            event.markPublished();
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "The event could not be published; it remains eligible for retry", ex);
        }
        auditService.record(actor(), "EVENT_RETRIED", "OutboxEvent", eventId, null);
        return view(event);
    }

    @GetMapping("/audit")
    public List<AuditEvent> audit(@RequestParam(defaultValue = "100") int limit) {
        return auditRepository.findAllByOrderByOccurredAtDesc(PageRequest.of(0, bounded(limit)));
    }

    @GetMapping("/consumed-events")
    public List<TrackedEvent> consumedEvents(@RequestParam(defaultValue = "200") int limit) {
        return trackedEvents.findAllByOrderByReceivedAtDesc(PageRequest.of(0, bounded(limit)));
    }

    private static int bounded(int limit) {
        return Math.min(Math.max(limit, 1), 500);
    }

    private static String actor() {
        if (SecurityContextHolder.getContext().getAuthentication() instanceof JwtAuthenticationToken jwt) {
            String email = jwt.getToken().getClaimAsString("email");
            if (email != null && !email.isBlank()) {
                return email;
            }
        }
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private static EventView view(OutboxEvent event) {
        return new EventView(event.getEventId(), event.getEventType(), event.getEventVersion(), event.getTopic(),
                event.getApplicationId(), event.getCorrelationId(), event.getStatus(), event.getAttempts(),
                event.getLastError(), event.getOccurredAt(), event.getPublishedAt(), event.getPayload());
    }
}
