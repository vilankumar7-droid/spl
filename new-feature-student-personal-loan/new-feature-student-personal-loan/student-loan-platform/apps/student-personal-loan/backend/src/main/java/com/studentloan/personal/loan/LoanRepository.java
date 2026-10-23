package com.studentloan.personal.loan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface LoanRepository extends JpaRepository<LoanApplication, Long> {

    @Query("select l from LoanApplication l join fetch l.applicant a where a.userId = :userId order by l.updatedAt desc")
    List<LoanApplication> findAllForUser(Long userId);

    @Query("select l from LoanApplication l join fetch l.applicant where l.status in :statuses order by l.submittedAt asc")
    List<LoanApplication> findByStatusIn(Collection<LoanStatus> statuses);

    @Query("select l from LoanApplication l join fetch l.applicant order by l.updatedAt desc")
    List<LoanApplication> findAllWithApplicant();

    List<LoanApplication> findByApplicantIdAndStatusIn(Long applicantId, Collection<LoanStatus> statuses);

    long countByStatus(LoanStatus status);
}
