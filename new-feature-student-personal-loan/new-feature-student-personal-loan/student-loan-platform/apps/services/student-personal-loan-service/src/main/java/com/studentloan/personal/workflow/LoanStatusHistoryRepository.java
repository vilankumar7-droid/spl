package com.studentloan.personal.workflow;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface LoanStatusHistoryRepository extends JpaRepository<LoanStatusHistory, Long> {

    List<LoanStatusHistory> findByLoanApplicationIdOrderByChangedAtAscIdAsc(Long loanApplicationId);

    @Query("select h from LoanStatusHistory h where h.loanApplicationId in :loanIds order by h.changedAt desc, h.id desc")
    List<LoanStatusHistory> findRecentForLoans(Collection<Long> loanIds, Pageable pageable);
}
