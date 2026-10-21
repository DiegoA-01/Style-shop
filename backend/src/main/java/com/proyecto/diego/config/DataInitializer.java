package com.proyecto.diego.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.proyecto.diego.entity.Role;
import com.proyecto.diego.entity.User;
import com.proyecto.diego.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Como /auth/register ya no es público (solo un SUPER_ADMIN puede crear
 * cuentas vía /users), tiene que existir un primer admin desde el arranque
 * o nadie podría crear al resto de usuarios. Se siembra una sola vez: si ya
 * hay algún SUPER_ADMIN en la base de datos, no hace nada.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.default-password}")
    private String adminDefaultPassword;

    @Override
    public void run(String... args) {
        if (userRepository.existsByRole(Role.SUPER_ADMIN)) {
            return;
        }

        User admin = new User();
        admin.setUsername(adminUsername);
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode(adminDefaultPassword));
        admin.setRole(Role.SUPER_ADMIN);
        userRepository.save(admin);

        log.info("Super admin creado automáticamente -> usuario: '{}', contraseña: '{}'. Cámbiala después de iniciar sesión.",
                adminUsername, adminDefaultPassword);
    }
}
