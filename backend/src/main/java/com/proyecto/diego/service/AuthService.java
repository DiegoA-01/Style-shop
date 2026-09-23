package com.proyecto.diego.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.proyecto.diego.dto.Request.LoginRequestDTO;
import com.proyecto.diego.dto.Request.RegisterRequestDTO;
import com.proyecto.diego.dto.Response.AuthResponseDTO;
import com.proyecto.diego.entity.User;
import com.proyecto.diego.repository.UserRepository;
import com.proyecto.diego.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthResponseDTO register(RegisterRequestDTO request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("El nombre de usuario ya existe");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("El correo ya existe");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        String token = jwtService.generateToken(user.getUsername());

        return AuthResponseDTO.builder()
                .token(token)
                .username(user.getUsername())
                .build();
    }

    public AuthResponseDTO login(LoginRequestDTO request) {
        // Lanza BadCredentialsException (401, ver GlobalExceptionHandler) si usuario/clave no coinciden.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        String token = jwtService.generateToken(request.getUsername());

        return AuthResponseDTO.builder()
                .token(token)
                .username(request.getUsername())
                .build();
    }
}
