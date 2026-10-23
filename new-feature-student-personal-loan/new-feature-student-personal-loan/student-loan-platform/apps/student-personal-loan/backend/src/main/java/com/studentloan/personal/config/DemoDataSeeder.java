package com.studentloan.personal.config;

import com.studentloan.personal.auth.Role;
import com.studentloan.personal.auth.User;
import com.studentloan.personal.auth.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Creates synthetic demo accounts for local development. Disable with SEED_DEMO_USERS=false. */
@Component
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final PlatformProperties properties;

    public DemoDataSeeder(UserRepository users, PasswordEncoder encoder, PlatformProperties properties) {
        this.users = users;
        this.encoder = encoder;
        this.properties = properties;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!properties.seed().demoUsers()) {
            return;
        }
        create("student@demo.local", "Asha Student", Role.STUDENT);
        create("reviewer@demo.local", "Ravi Reviewer", Role.REVIEWER);
        create("admin@demo.local", "Platform Admin", Role.ADMIN);
    }

    private void create(String email, String name, Role role) {
        if (!users.existsByEmailIgnoreCase(email)) {
            users.save(new User(email, encoder.encode(properties.seed().demoPassword()), name, role));
            log.info("Seeded demo {} account {}", role, email);
        }
    }
}
