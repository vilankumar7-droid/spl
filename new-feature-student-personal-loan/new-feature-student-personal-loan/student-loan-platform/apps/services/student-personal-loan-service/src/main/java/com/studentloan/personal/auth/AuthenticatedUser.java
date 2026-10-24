package com.studentloan.personal.auth;

/** Principal stored in the SecurityContext after a JWT is validated. */
public record AuthenticatedUser(Long id, String email, Role role) {

    public boolean isStaff() {
        return role == Role.REVIEWER || role == Role.ADMIN;
    }
}
