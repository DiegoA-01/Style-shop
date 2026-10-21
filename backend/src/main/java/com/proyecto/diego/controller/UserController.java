package com.proyecto.diego.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.diego.dto.Request.CreateUserRequestDTO;
import com.proyecto.diego.dto.Response.GlobalResponseDTO;
import com.proyecto.diego.dto.Response.UserResponseDTO;
import com.proyecto.diego.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Gestión de cuentas (super admin y trabajadores). Restringido a
 * SUPER_ADMIN en SecurityConfig ("/users/**" -> hasRole("SUPER_ADMIN")).
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<GlobalResponseDTO<List<UserResponseDTO>>> listUsers() {
        List<UserResponseDTO> users = userService.listUsers();

        return ResponseEntity.ok(
            GlobalResponseDTO.<List<UserResponseDTO>>builder()
                            .message("Lista de usuarios obtenida correctamente")
                            .data(users)
                            .build()
        );
    }

    @PostMapping
    public ResponseEntity<GlobalResponseDTO<UserResponseDTO>> createUser(@Valid @RequestBody CreateUserRequestDTO request) {
        UserResponseDTO response = userService.createUser(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
            GlobalResponseDTO.<UserResponseDTO>builder()
                            .message("Usuario creado exitosamente")
                            .data(response)
                            .build()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<GlobalResponseDTO<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);

        return ResponseEntity.ok(
            GlobalResponseDTO.<Void>builder()
                            .message("Usuario eliminado correctamente")
                            .build()
        );
    }
}
