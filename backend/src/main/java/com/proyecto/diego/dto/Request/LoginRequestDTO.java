package com.proyecto.diego.dto.Request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequestDTO {

    @NotBlank(message = "El nombre de usuario es obligatorio.")
    private String username;

    @NotBlank(message = "La contraseña es obligatoria.")
    private String password;
}
