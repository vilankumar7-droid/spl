package com.studentloan.personal.loan;

import com.studentloan.personal.auth.CurrentUser;
import com.studentloan.personal.loan.dto.LoanDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/loans")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    @GetMapping
    public List<LoanSummary> list() {
        return loanService.listMine(CurrentUser.get());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LoanDetail create(@Valid @RequestBody CreateLoanRequest request) {
        return loanService.create(CurrentUser.get(), request);
    }

    @GetMapping("/{id}")
    public LoanDetail get(@PathVariable Long id) {
        return loanService.get(CurrentUser.get(), id);
    }

    @PatchMapping("/{id}")
    public LoanDetail update(@PathVariable Long id, @Valid @RequestBody UpdateLoanRequest request) {
        return loanService.update(CurrentUser.get(), id, request);
    }

    @PostMapping("/{id}/submit")
    public LoanDetail submit(@PathVariable Long id) {
        return loanService.submit(CurrentUser.get(), id);
    }

    @PostMapping("/{id}/cancel")
    public LoanDetail cancel(@PathVariable Long id, @Valid @RequestBody(required = false) ReasonRequest request) {
        return loanService.cancel(CurrentUser.get(), id, request == null ? null : request.reason());
    }

    @GetMapping("/{id}/timeline")
    public List<TimelineEntry> timeline(@PathVariable Long id) {
        return loanService.timeline(CurrentUser.get(), id);
    }
}
