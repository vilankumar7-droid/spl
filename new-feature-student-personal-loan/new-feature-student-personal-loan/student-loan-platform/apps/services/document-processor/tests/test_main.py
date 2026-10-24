from io import BytesIO

from fastapi.testclient import TestClient
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen.canvas import Canvas

from app import app

client = TestClient(app)


def make_pdf(*, encrypted: bool = False, with_text: bool = False) -> bytes:
    source = BytesIO()
    canvas = Canvas(source, pagesize=(72, 72))
    if with_text:
        canvas.drawString(10, 40, "Synthetic supporting document")
    canvas.save()
    reader = PdfReader(BytesIO(source.getvalue()))
    writer = PdfWriter()
    writer.append_pages_from_reader(reader)
    if encrypted:
        writer.encrypt("test-password")
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def upload(content: bytes, filename: str = "support.pdf"):
    return client.post(
        "/verify",
        data={"documentId": "DOC-TEST1234", "documentType": "ENROLLMENT"},
        files={"file": (filename, content, "application/pdf")},
    )


def test_health_check():
    assert client.get("/health").json() == {"status": "UP"}


def test_rejects_non_pdf_signature():
    response = upload(b"not a pdf")
    assert response.status_code == 200
    assert response.json()["status"] == "FAILED"


def test_routes_encrypted_pdf_to_manual_review():
    response = upload(make_pdf(encrypted=True))
    assert response.status_code == 200
    assert response.json()["status"] == "NEEDS_MANUAL_REVIEW"


def test_routes_pdf_without_extractable_text_to_manual_review():
    response = upload(make_pdf())
    assert response.status_code == 200
    assert response.json()["status"] == "NEEDS_MANUAL_REVIEW"


def test_validates_parseable_text_pdf():
    response = upload(make_pdf(with_text=True))
    assert response.status_code == 200
    assert response.json()["status"] == "VALIDATED"
    assert "human review" in response.json()["message"]


def test_returns_failed_for_truncated_pdf():
    response = upload(b"%PDF-1.7\nnot a complete document")
    assert response.status_code == 200
    assert response.json()["status"] == "NEEDS_MANUAL_REVIEW"


def test_rejects_upload_over_size_limit(monkeypatch):
    monkeypatch.setattr("app.MAX_PDF_BYTES", 4)
    response = upload(b"%PDF-1.7")
    assert response.status_code == 413


def test_rejects_missing_document_metadata():
    response = client.post(
        "/verify",
        data={"documentId": "DOC-TEST1234"},
        files={"file": ("support.pdf", make_pdf(), "application/pdf")},
    )
    assert response.status_code == 422
