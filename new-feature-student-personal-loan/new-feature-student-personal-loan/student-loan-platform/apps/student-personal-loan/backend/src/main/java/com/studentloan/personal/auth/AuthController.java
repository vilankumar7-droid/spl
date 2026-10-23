package com.studentloan.personal.auth;

import com.studentloan.personal.auth.dto.AuthDtos.AuthResponse;
import com.studentloan.personal.auth.dto.AuthDtos.LoginRequest;
import com.studentloan.personal.auth.dto.AuthDtos.RegisterRequest;
import com.studentloan.personal.auth.dto.AuthDtos.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me() {
        return authService.me(CurrentUser.get());
    }
}
