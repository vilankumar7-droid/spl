package com.studentloan.personal.applicant;

import com.studentloan.personal.applicant.dto.ApplicantDtos.ApplicantRequest;
import com.studentloan.personal.applicant.dto.ApplicantDtos.ApplicantResponse;
import com.studentloan.personal.auth.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/applicants")
public class ApplicantController {

    private final ApplicantService applicantService;

    public ApplicantController(ApplicantService applicantService) {
        this.applicantService = applicantService;
    }

    @GetMapping("/me")
    public ApplicantResponse me() {
        return applicantService.me(CurrentUser.get());
    }

    @PutMapping("/me")
    public ApplicantResponse update(@Valid @RequestBody ApplicantRequest request) {
        return applicantService.update(CurrentUser.get(), request);
    }
}
