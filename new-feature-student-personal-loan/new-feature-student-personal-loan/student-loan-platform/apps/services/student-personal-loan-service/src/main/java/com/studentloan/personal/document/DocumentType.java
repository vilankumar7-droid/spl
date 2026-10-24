package com.studentloan.personal.document;

public enum DocumentType {
    IDENTITY_PROOF(true),
    INCOME_PROOF(true),
    ADMISSION_LETTER(false),
    OTHER(false);

    private final boolean required;

    DocumentType(boolean required) {
        this.required = required;
    }

    public boolean isRequired() {
        return required;
    }
}
