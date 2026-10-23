package com.studentloan.personal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studentloan.personal.messaging.OutboxPublisher;
import com.studentloan.personal.messaging.OutboxRepository;
import com.studentloan.personal.messaging.OutboxStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LoanWorkflowIntegrationTest {

    private static final byte[] PDF = "%PDF-1.4\n%demo\n".getBytes();

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired OutboxRepository outbox;
    @Autowired OutboxPublisher outboxPublisher;

    @Test
    void protectedEndpointsRequireToken() throws Exception {
        mvc.perform(get("/api/v1/loans")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        mvc.perform(get("/api/v1/loans").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void featuresAndCalculatorArePublic() throws Exception {
        mvc.perform(get("/api/v1/features")).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.key=='personal-loan')].enabled").value(true))
                .andExpect(jsonPath("$[?(@.key=='home-loan')].enabled").value(false));
        mvc.perform(get("/api/v1/calculator/emi?amount=150000&tenureMonths=24&annualRate=10.5"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.monthlyInstallment").value(6956.41));
    }

    @Test
    void registrationValidatesInputAndRejectsDuplicates() throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"displayName\":\"\",\"email\":\"bad\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
        String email = uniqueEmail();
        register(email).andExpect(status().isCreated()).andExpect(jsonPath("$.user.role").value("STUDENT"));
        register(email).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("EMAIL_TAKEN"));
    }

    @Test
    void wrongPasswordIsRejected() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"student@demo.local\",\"password\":\"Wrong123\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void fullPersonalLoanWorkflow() throws Exception {
        String student = tokenFor(register(uniqueEmail()));
        completeProfile(student);
        long loanId = createLoan(student);

        JsonNode detail = read(mvc.perform(get("/api/v1/loans/" + loanId).header("Authorization", bearer(student))));
        assertThat(detail.at("/loan/status").asText()).isEqualTo("DOCUMENTS_PENDING");
        assertThat(detail.at("/loan/referenceNumber").asText()).startsWith("PLN-");

        mvc.perform(post("/api/v1/loans/" + loanId + "/submit").header("Authorization", bearer(student)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("APPLICATION_INCOMPLETE"));

        upload(student, loanId, "IDENTITY_PROOF", PDF).andExpect(status().isCreated());
        upload(student, loanId, "INCOME_PROOF", PDF).andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("VALIDATED"));

        mvc.perform(post("/api/v1/loans/" + loanId + "/submit").header("Authorization", bearer(student)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.loan.status").value("SUBMITTED"));

        mvc.perform(patch("/api/v1/loans/" + loanId).header("Authorization", bearer(student))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"tenureMonths\":36}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("NOT_EDITABLE"));

        mvc.perform(post("/api/v1/review/loans/" + loanId + "/start").header("Authorization", bearer(student)))
                .andExpect(status().isForbidden());

        String reviewer = login("reviewer@demo.local");
        mvc.perform(post("/api/v1/review/loans/" + loanId + "/decision").header("Authorization", bearer(reviewer))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"decision\":\"APPROVE\",\"reason\":\"ok\"}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("INVALID_TRANSITION"));
        mvc.perform(post("/api/v1/review/loans/" + loanId + "/start").header("Authorization", bearer(reviewer)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.loan.status").value("VERIFICATION_IN_PROGRESS"));
        mvc.perform(post("/api/v1/review/loans/" + loanId + "/decision").header("Authorization", bearer(reviewer))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"decision\":\"APPROVE\",\"reason\":\"\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/review/loans/" + loanId + "/decision").header("Authorization", bearer(reviewer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decision\":\"APPROVE\",\"reason\":\"Income proof is clear\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loan.status").value("APPROVED"))
                .andExpect(jsonPath("$.decisionReason").value("Income proof is clear"));

        JsonNode timeline = read(mvc.perform(get("/api/v1/loans/" + loanId + "/timeline")
                .header("Authorization", bearer(student))));
        assertThat(timeline.get(timeline.size() - 1).get("toStatus").asText()).isEqualTo("APPROVED");
        assertThat(timeline.get(timeline.size() - 1).get("actor").asText()).isEqualTo("reviewer@demo.local");

        String ref = detail.at("/loan/referenceNumber").asText();
        var events = outbox.findByAggregateIdOrderByIdAsc(ref);
        assertThat(events).extracting(e -> e.getEventType()).contains("loan.application.submitted", "loan.status.changed");
        assertThat(events).allSatisfy(e -> assertThat(e.getPayload()).doesNotContain("Bearer").contains("\"eventVersion\":1"));

        outboxPublisher.publishPending();
        assertThat(outbox.findByAggregateIdOrderByIdAsc(ref)).allMatch(e -> e.getStatus() == OutboxStatus.PUBLISHED);
    }

    @Test
    void studentsCannotAccessOtherStudentsLoans() throws Exception {
        String owner = tokenFor(register(uniqueEmail()));
        completeProfile(owner);
        long loanId = createLoan(owner);
        String other = tokenFor(register(uniqueEmail()));

        mvc.perform(get("/api/v1/loans/" + loanId).header("Authorization", bearer(other))).andExpect(status().isNotFound());
        upload(other, loanId, "IDENTITY_PROOF", PDF).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/operations/events").header("Authorization", bearer(other))).andExpect(status().isForbidden());

        String reviewer = login("reviewer@demo.local");
        mvc.perform(get("/api/v1/loans/" + loanId).header("Authorization", bearer(reviewer))).andExpect(status().isOk());
    }

    @Test
    void nonPdfUploadsAreRejected() throws Exception {
        String student = tokenFor(register(uniqueEmail()));
        completeProfile(student);
        long loanId = createLoan(student);
        upload(student, loanId, "IDENTITY_PROOF", "not a pdf".getBytes())
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_PDF"));
    }

    @Test
    void loanValidationRejectsOutOfRangeValues() throws Exception {
        String student = tokenFor(register(uniqueEmail()));
        mvc.perform(post("/api/v1/loans").header("Authorization", bearer(student)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requestedAmount\":100,\"tenureMonths\":500,\"interestRate\":10,\"purpose\":\"OTHER\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.requestedAmount").exists())
                .andExpect(jsonPath("$.fieldErrors.tenureMonths").exists());
    }

    private void completeProfile(String token) throws Exception {
        mvc.perform(put("/api/v1/applicants/me").header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Test Student\",\"phone\":\"+91 90000 00000\",\"employmentType\":\"FULL_TIME_STUDENT\",\"monthlyIncome\":15000}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.profileComplete").value(true));
    }

    private long createLoan(String token) throws Exception {
        JsonNode created = read(mvc.perform(post("/api/v1/loans").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requestedAmount\":150000,\"tenureMonths\":24,\"interestRate\":10.5,\"purpose\":\"TUITION_FEES\"}"))
                .andExpect(status().isCreated()));
        return created.at("/loan/id").asLong();
    }

    private ResultActions upload(String token, long loanId, String type, byte[] content) throws Exception {
        return mvc.perform(multipart("/api/v1/loans/" + loanId + "/documents")
                .file(new MockMultipartFile("file", "doc.pdf", "application/pdf", content))
                .param("type", type).header("Authorization", bearer(token)));
    }

    private ResultActions register(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"displayName\":\"Test Student\",\"email\":\"" + email + "\",\"password\":\"Password123\"}"));
    }

    private String login(String email) throws Exception {
        return tokenFor(mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"Password@123\"}")).andExpect(status().isOk()));
    }

    private String tokenFor(ResultActions result) throws Exception {
        return read(result).get("accessToken").asText();
    }

    private JsonNode read(ResultActions result) throws Exception {
        return json.readTree(result.andReturn().getResponse().getContentAsString());
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private static String uniqueEmail() {
        return "student-" + UUID.randomUUID().toString().substring(0, 8) + "@test.local";
    }
}
