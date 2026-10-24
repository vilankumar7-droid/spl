package com.studentloan.personal.applicant;

import com.studentloan.personal.applicant.dto.ApplicantDtos.ApplicantRequest;
import com.studentloan.personal.applicant.dto.ApplicantDtos.ApplicantResponse;
import com.studentloan.personal.auth.AuthenticatedUser;
import com.studentloan.personal.auth.UserRepository;
import com.studentloan.personal.common.exception.ApiException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicantService {

    /** Published after a profile update so open loan drafts can re-evaluate their workflow stage. */
    public record ApplicantProfileUpdated(Long applicantId, String actor) {
    }

    private final ApplicantRepository applicants;
    private final UserRepository users;
    private final ApplicationEventPublisher events;

    public ApplicantService(ApplicantRepository applicants, UserRepository users, ApplicationEventPublisher events) {
        this.applicants = applicants;
        this.users = users;
        this.events = events;
    }

    /** Returns the caller's applicant profile, creating an empty one on first use. */
    @Transactional
    public Applicant getOrCreate(AuthenticatedUser user) {
        return applicants.findByUserId(user.id()).orElseGet(() -> {
            String name = users.findById(user.id()).map(u -> u.getDisplayName())
                    .orElseThrow(() -> ApiException.notFound("User"));
            return applicants.save(new Applicant(user.id(), name));
        });
    }

    @Transactional
    public ApplicantResponse me(AuthenticatedUser user) {
        return toResponse(getOrCreate(user));
    }

    @Transactional
    public ApplicantResponse update(AuthenticatedUser user, ApplicantRequest r) {
        Applicant applicant = getOrCreate(user);
        applicant.update(r.fullName().trim(), r.phone().trim(), trim(r.city()), r.employmentType(),
                trim(r.institutionName()), r.monthlyIncome());
        events.publishEvent(new ApplicantProfileUpdated(applicant.getId(), user.email()));
        return toResponse(applicant);
    }

    private static String trim(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    public static ApplicantResponse toResponse(Applicant a) {
        return new ApplicantResponse(a.getId(), a.getFullName(), a.getPhone(), a.getCity(), a.getEmploymentType(),
                a.getInstitutionName(), a.getMonthlyIncome(), a.isProfileComplete());
    }
}
