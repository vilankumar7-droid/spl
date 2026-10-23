package com.studentloan.personal;

import com.studentloan.personal.loan.LoanStatus;
import com.studentloan.personal.workflow.WorkflowService;
import org.junit.jupiter.api.Test;

import static com.studentloan.personal.loan.LoanStatus.*;
import static org.assertj.core.api.Assertions.assertThat;

class WorkflowServiceTest {

    @Test
    void draftCannotBeApprovedDirectly() {
        assertThat(WorkflowService.canTransition(DRAFT, APPROVED)).isFalse();
        assertThat(WorkflowService.canTransition(READY_FOR_REVIEW, APPROVED)).isFalse();
    }

    @Test
    void happyPathTransitionsAreAllowed() {
        assertThat(WorkflowService.canTransition(DRAFT, DOCUMENTS_PENDING)).isTrue();
        assertThat(WorkflowService.canTransition(DOCUMENTS_PENDING, READY_FOR_REVIEW)).isTrue();
        assertThat(WorkflowService.canTransition(READY_FOR_REVIEW, SUBMITTED)).isTrue();
        assertThat(WorkflowService.canTransition(SUBMITTED, VERIFICATION_IN_PROGRESS)).isTrue();
        assertThat(WorkflowService.canTransition(VERIFICATION_IN_PROGRESS, APPROVED)).isTrue();
    }

    @Test
    void finalStatusesHaveNoExits() {
        for (LoanStatus s : LoanStatus.FINAL) {
            assertThat(WorkflowService.allowedFrom(s)).isEmpty();
        }
    }

    @Test
    void correctionLoopsBackToEditing() {
        assertThat(WorkflowService.canTransition(VERIFICATION_IN_PROGRESS, NEEDS_CORRECTION)).isTrue();
        assertThat(WorkflowService.canTransition(NEEDS_CORRECTION, READY_FOR_REVIEW)).isTrue();
        assertThat(NEEDS_CORRECTION.isEditable()).isTrue();
        assertThat(SUBMITTED.isEditable()).isFalse();
    }
}
