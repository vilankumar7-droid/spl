package com.studentloan.personal.review.dto;

import com.studentloan.personal.review.ReviewDecision;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ReviewDtos {

    private ReviewDtos() {
    }

    public record DecisionRequest(
            @NotNull(message = "Choose a decision") ReviewDecision decision,
            @NotBlank(message = "Please explain the decision so the applicant understands it")
            @Size(max = 1000) String reason) {
    }
}
