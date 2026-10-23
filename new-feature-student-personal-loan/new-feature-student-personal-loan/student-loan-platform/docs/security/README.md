# Security notes

- Passwords are hashed with BCrypt. Self-registration always creates `STUDENT` accounts.
- JWTs are signed with HS256 using `JWT_SECRET` (32+ chars, from the environment, never committed). Issuer
  and expiry are checked on every request.
- Authorization is done on the server: roles through Spring Security, ownership in `LoanAccess`. Route guards
  in the UI only exist for a better user experience.
- Uploads must be PDFs (extension and `%PDF-` signature), at most 5 MB, and are stored under generated names
  outside the web root. Downloads are sent with `Content-Disposition: attachment` and `nosniff`.
- Logs, events and audit records never contain passwords, tokens or document contents.
- Failed logins are audited. Rate limiting and account lockout are recommended next steps.
