from __future__ import annotations

from io import BytesIO
import os
from typing import Literal

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from pypdf import PdfReader
from pypdf.errors import PdfReadError, PdfStreamError

MAX_PDF_BYTES = int(os.getenv("MAX_PDF_BYTES", str(5 * 1024 * 1024)))
PDF_SIGNATURE = b"%PDF-"

app = FastAPI(title="Student Loan Document Processor", version="1.0.0")


class VerificationResult(BaseModel):
    status: Literal["VALIDATED", "FAILED", "NEEDS_MANUAL_REVIEW"]
    message: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "UP"}


@app.post("/verify", response_model=VerificationResult)
def verify_document(
    file: UploadFile = File(...),
    document_id: str = Form(..., alias="documentId"),
    document_type: str = Form(..., alias="documentType"),
) -> VerificationResult:
    if not document_id.strip() or not document_type.strip():
        raise HTTPException(status_code=422, detail="Document identifiers are required")

    content = file.file.read(MAX_PDF_BYTES + 1)
    if len(content) > MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="PDF exceeds the configured size limit")
    if not content.startswith(PDF_SIGNATURE):
        return VerificationResult(status="FAILED", message="The uploaded file is not a PDF")

    try:
        reader = PdfReader(BytesIO(content), strict=True)
        if reader.is_encrypted:
            return VerificationResult(
                status="NEEDS_MANUAL_REVIEW",
                message="Encrypted PDFs require manual review",
            )
        if not reader.pages:
            return VerificationResult(status="FAILED", message="The PDF contains no pages")

        extracted_text = "".join(page.extract_text() or "" for page in reader.pages)
    except (PdfReadError, PdfStreamError, ValueError, OSError, EOFError):
        return VerificationResult(
            status="NEEDS_MANUAL_REVIEW",
            message="The PDF could not be fully parsed; manual review is required",
        )

    if not extracted_text.strip():
        return VerificationResult(
            status="NEEDS_MANUAL_REVIEW",
            message="No extractable text was found; manual review is required",
        )

    return VerificationResult(
        status="VALIDATED",
        message=f"PDF parsed successfully ({len(reader.pages)} page(s)); content still requires human review",
    )
