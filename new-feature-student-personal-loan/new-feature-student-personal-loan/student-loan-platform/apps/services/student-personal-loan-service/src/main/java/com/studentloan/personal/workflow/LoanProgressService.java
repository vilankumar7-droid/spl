package com.studentloan.personal.workflow;

import com.studentloan.personal.applicant.ApplicantService.ApplicantProfileUpdated;
import com.studentloan.personal.document.DocumentReference;
import com.studentloan.personal.document.DocumentRepository;
import com.studentloan.personal.document.DocumentStatus;
import com.studentloan.personal.document.DocumentType;
import com.studentloan.personal.loan.LoanApplication;
import com.studentloan.personal.loan.LoanRepository;
import com.studentloan.personal.loan.LoanStatus;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/** Derives which preparation stage an editable application is in from its profile, details and documents. */
@Service
public class LoanProgressService {

    public record Checklist(boolean profileComplete, boolean loanDetailsComplete, boolean identityProofUploaded,
                            boolean incomeProofUploaded, boolean documentsProcessing) {

        public boolean readyForReview() {
            return profileComplete && loanDetailsComplete && identityProofUploaded && incomeProofUploaded
                    && !documentsProcessing;
        }

        public List<String> missingItems() {
            List<String> missing = new java.util.ArrayList<>();
            if (!profileComplete) missing.add("Complete your applicant profile");
            if (!loanDetailsComplete) missing.add("Complete the loan details");
            if (!identityProofUploaded) missing.add("Upload an identity proof (PDF)");
            if (!incomeProofUploaded) missing.add("Upload an income proof (PDF)");
            if (documentsProcessing) missing.add("Wait for documents to finish processing");
            return missing;
        }
    }

    private final DocumentRepository documents;
    private final LoanRepository loans;
    private final WorkflowService workflow;

    public LoanProgressService(DocumentRepository documents, LoanRepository loans, WorkflowService workflow) {
        this.documents = documents;
        this.loans = loans;
        this.workflow = workflow;
    }

    public Checklist checklist(LoanApplication loan) {
        List<DocumentReference> docs = documents.findByLoanApplicationIdOrderByUploadedAtAsc(loan.getId());
        Set<DocumentType> validated = docs.stream()
                .filter(d -> d.getStatus() == DocumentStatus.VALIDATED)
                .map(DocumentReference::getDocumentType)
                .collect(Collectors.toSet());
        boolean processing = docs.stream().anyMatch(d ->
                d.getStatus() == DocumentStatus.QUEUED || d.getStatus() == DocumentStatus.PROCESSING
                        || d.getStatus() == DocumentStatus.UPLOADED);
        return new Checklist(loan.getApplicant().isProfileComplete(), loan.isLoanDetailsComplete(),
                validated.contains(DocumentType.IDENTITY_PROOF), validated.contains(DocumentType.INCOME_PROOF),
                processing);
    }

    public static List<DocumentType> requiredDocuments() {
        return Arrays.stream(DocumentType.values()).filter(DocumentType::isRequired).toList();
    }

    /** Moves an editable application to the stage matching its current completeness. */
    @Transactional
    public void recompute(LoanApplication loan, String actor) {
        if (!loan.getStatus().isEditable()) {
            return;
        }
        Checklist c = checklist(loan);
        LoanStatus target;
        String reason;
        if (!c.profileComplete() || !c.loanDetailsComplete()) {
            target = LoanStatus.DETAILS_PENDING;
            reason = "Waiting for applicant and loan details";
        } else if (c.documentsProcessing()) {
            target = LoanStatus.DOCUMENTS_PROCESSING;
            reason = "Documents are being processed";
        } else if (!c.identityProofUploaded() || !c.incomeProofUploaded()) {
            target = LoanStatus.DOCUMENTS_PENDING;
            reason = "Waiting for required documents";
        } else {
            target = LoanStatus.READY_FOR_REVIEW;
            reason = "All required information provided";
        }
        if (target != loan.getStatus() && WorkflowService.canTransition(loan.getStatus(), target)) {
            workflow.transition(loan, target, actor, reason);
        }
    }

    @EventListener
    @Transactional
    public void onProfileUpdated(ApplicantProfileUpdated event) {
        loans.findByApplicantIdAndStatusIn(event.applicantId(), LoanStatus.EDITABLE)
                .forEach(loan -> recompute(loan, event.actor()));
    }
}
