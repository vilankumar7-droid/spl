CREATE TABLE tracked_event (
    event_id VARCHAR(40) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_version INTEGER NOT NULL,
    topic VARCHAR(100) NOT NULL,
    application_id VARCHAR(40) NOT NULL,
    correlation_id VARCHAR(64),
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    payload TEXT NOT NULL
);

CREATE INDEX idx_tracked_event_received_at ON tracked_event (received_at DESC);
CREATE INDEX idx_tracked_event_application_id ON tracked_event (application_id);
