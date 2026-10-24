package com.studentloan.personal.review;

import com.studentloan.personal.auth.CurrentUser;
import com.studentloan.personal.loan.dto.LoanDtos.LoanDetail;
import com.studentloan.personal.loan.dto.LoanDtos.LoanSummary;
import com.studentloan.personal.review.dto.ReviewDtos.DecisionRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/review/loans")
@PreAuthorize("hasAnyRole('REVIEWER','ADMIN')")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public List<LoanSummary> queue(@RequestParam(defaultValue = "false") boolean all) {
        return reviewService.queue(all);
    }

    @PostMapping("/{id}/start")
    public LoanDetail start(@PathVariable Long id) {
        return reviewService.startReview(CurrentUser.get(), id);
    }

    @PostMapping("/{id}/decision")
    public LoanDetail decide(@PathVariable Long id, @Valid @RequestBody DecisionRequest request) {
        return reviewService.decide(CurrentUser.get(), id, request);
    }
}
