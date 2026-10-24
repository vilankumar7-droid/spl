package com.studentloan.personal.feature;

public enum Feature {
    PERSONAL_LOAN("personal-loan", "Personal Loan", "Application form and status workflow", "A"),
    JWT_AUTHENTICATION("jwt-authentication", "JWT authentication", "Login, roles and authorization", "A"),
    HOME_LOAN("home-loan", "Home Loan", "Property details and loan workflow", "B"),
    PDF_PROCESSING_AGENT("pdf-processing-agent", "PDF processing agent", "Python extraction and validation", "C"),
    KAFKA_EVENT_TRACKING("kafka-event-tracking", "Kafka event tracking", "Topics, consumers and event timeline", "D"),
    BACKGROUND_VERIFICATION("background-verification", "Background verification",
            "Identity, address and employment demo checks", "E"),
    ELASTIC_STACK("elastic-stack", "Elastic Stack", "Structured logs and Kibana dashboards", "F"),
    SPLUNK_INTEGRATION("splunk-integration", "Splunk integration", "Forward logs and build search dashboards", "F");

    private final String key;
    private final String label;
    private final String description;
    private final String stage;

    Feature(String key, String label, String description, String stage) {
        this.key = key;
        this.label = label;
        this.description = description;
        this.stage = stage;
    }

    public String key() { return key; }
    public String label() { return label; }
    public String description() { return description; }
    public String stage() { return stage; }
}
