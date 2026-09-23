package com.proyecto.diego.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.diego.dto.Request.LoginRequestDTO;
import com.proyecto.diego.dto.Request.RegisterRequestDTO;
import com.proyecto.diego.dto.Response.AuthResponseDTO;
import com.proyecto.diego.dto.Response.GlobalResponseDTO;
import com.proyecto.diego.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<GlobalResponseDTO<AuthResponseDTO>> register(@Valid @RequestBody RegisterRequestDTO request) {
        AuthResponseDTO response = authService.register(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
            GlobalResponseDTO.<AuthResponseDTO>builder()
                            .message("Usuario registrado exitosamente")
                            .data(response)
                            .build()
        );
    }

    @PostMapping("/login")
    public ResponseEntity<GlobalResponseDTO<AuthResponseDTO>> login(@Valid @RequestBody LoginRequestDTO request) {
        AuthResponseDTO response = authService.login(request);

        return ResponseEntity.ok(
            GlobalResponseDTO.<AuthResponseDTO>builder()
                            .message("Inicio de sesión exitoso")
                            .data(response)
                            .build()
        );
    }
}
