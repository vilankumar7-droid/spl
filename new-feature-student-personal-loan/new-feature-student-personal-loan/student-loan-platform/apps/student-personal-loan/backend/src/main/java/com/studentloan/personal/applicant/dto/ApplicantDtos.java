package com.studentloan.personal.applicant.dto;

import com.studentloan.personal.applicant.EmploymentType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public final class ApplicantDtos {

    private ApplicantDtos() {
    }

    public record ApplicantRequest(
            @NotBlank(message = "Full name is required") @Size(max = 120) String fullName,
            @NotBlank(message = "Phone number is required")
            @Pattern(regexp = "^\\+?[0-9 -]{7,20}$", message = "Enter a valid phone number") String phone,
            @Size(max = 80) String city,
            @NotNull(message = "Select your employment type") EmploymentType employmentType,
            @Size(max = 120) String institutionName,
            @NotNull(message = "Monthly income is required")
            @DecimalMin(value = "0", message = "Income cannot be negative")
            @DecimalMax(value = "10000000", message = "Income looks too high for this demo") BigDecimal monthlyIncome) {
    }

    public record ApplicantResponse(Long id, String fullName, String phone, String city,
                                    EmploymentType employmentType, String institutionName,
                                    BigDecimal monthlyIncome, boolean profileComplete) {
    }
}
