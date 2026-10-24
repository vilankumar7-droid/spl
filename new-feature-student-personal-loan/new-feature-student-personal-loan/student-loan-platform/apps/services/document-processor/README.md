# Document Processor

Internal FastAPI service for deep, technical PDF verification. It checks the PDF signature, strict parser
validity, encryption, page presence, and extractable text. It does not establish identity, authenticity,
eligibility, or the truth of a document; uncertain/scanned files are routed to manual review.

## Run

```powershell
python -m pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Prerequisites: Python 3.11+.

For tests, install `requirements-dev.txt` and run `python -m pytest`.

The service accepts the core API's multipart `POST /verify` request with `file`, `documentId`, and
`documentType` fields. It returns `VALIDATED`, `FAILED`, or `NEEDS_MANUAL_REVIEW` with a display-safe message.
Files are processed in memory and are not retained. The default upload limit is 5 MiB and can be changed with
`MAX_PDF_BYTES`.

This endpoint is intended for the private Compose network and is not independently authenticated. Do not
publish it directly to untrusted networks.
