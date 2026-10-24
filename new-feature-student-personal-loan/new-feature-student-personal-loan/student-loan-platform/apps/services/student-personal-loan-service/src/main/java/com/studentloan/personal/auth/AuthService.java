package com.studentloan.personal.auth;

import com.studentloan.personal.audit.AuditService;
import com.studentloan.personal.auth.dto.AuthDtos.AuthResponse;
import com.studentloan.personal.auth.dto.AuthDtos.LoginRequest;
import com.studentloan.personal.auth.dto.AuthDtos.RegisterRequest;
import com.studentloan.personal.auth.dto.AuthDtos.UserResponse;
import com.studentloan.personal.common.exception.ApiException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService audit;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService, AuditService audit) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.audit = audit;
    }

    /** Self-registration always creates a STUDENT account; staff roles are provisioned separately. */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("EMAIL_TAKEN", "An account with this email already exists");
        }
        User user = users.save(new User(email, passwordEncoder.encode(request.password()),
                request.displayName().trim(), Role.STUDENT));
        audit.record(email, "USER_REGISTERED", "User", String.valueOf(user.getId()), null);
        return tokenFor(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        User user = users.findByEmailIgnoreCase(email)
                .filter(u -> u.isEnabled() && passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElse(null);
        if (user == null) {
            audit.record(email, "LOGIN_FAILED", "User", null, null);
            throw new BadCredentialsException("Invalid credentials");
        }
        audit.record(email, "LOGIN_SUCCEEDED", "User", String.valueOf(user.getId()), null);
        return tokenFor(user);
    }

    @Transactional(readOnly = true)
    public UserResponse me(AuthenticatedUser principal) {
        return users.findById(principal.id()).map(AuthService::toResponse)
                .orElseThrow(() -> ApiException.notFound("User"));
    }

    private AuthResponse tokenFor(User user) {
        JwtService.IssuedToken token = jwtService.issue(user);
        return new AuthResponse(token.token(), "Bearer", token.expiresAt(), toResponse(user));
    }

    static UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole());
    }
}
