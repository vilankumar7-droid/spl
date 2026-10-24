package com.studentloan.personal.document;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<DocumentReference, Long> {

    List<DocumentReference> findByLoanApplicationIdOrderByUploadedAtAsc(Long loanApplicationId);

    Optional<DocumentReference> findByLoanApplicationIdAndDocumentType(Long loanApplicationId, DocumentType type);

    Optional<DocumentReference> findByPublicIdAndLoanApplicationId(String publicId, Long loanApplicationId);
}
