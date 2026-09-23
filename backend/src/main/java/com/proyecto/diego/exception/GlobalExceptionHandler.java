package com.proyecto.diego.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.proyecto.diego.dto.Response.GlobalResponseDTO;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Usuario/contraseña incorrectos al hacer login (Spring Security).
    // Se declara aparte porque AuthenticationException también es RuntimeException,
    // y su mensaje no contiene ninguna palabra clave que resolveStatus() reconozca.
    @ExceptionHandler (AuthenticationException.class)
    public ResponseEntity<GlobalResponseDTO<Object>> handleAuthenticationException(AuthenticationException ex){

        GlobalResponseDTO<Object> response = GlobalResponseDTO.builder()
            .message("Usuario o contraseña incorrectos")
            .data(null)
            .build();

            return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler (RuntimeException.class)
    public ResponseEntity<GlobalResponseDTO<Object>> handleRuntimeException(RuntimeException ex){

        HttpStatus status = resolveStatus(ex.getMessage());

        GlobalResponseDTO<Object> response = GlobalResponseDTO.builder()
            .message(ex.getMessage())
            .data(null)
            .build();

            return new ResponseEntity<>(response, status);
    }

     // ── Decide el status HTTP leyendo palabras clave del mensaje ──
    private HttpStatus resolveStatus(String message){
        if (message == null) {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }

        String msg = message.toLowerCase();

        if (msg.contains("no encontrada") || msg.contains("no encontrado")) {
            return HttpStatus.NOT_FOUND; //404
        }

        if (msg.contains("ya existe") || msg.contains("no se puede eliminar")) {
            return HttpStatus.CONFLICT; //409
        }

        return HttpStatus.BAD_REQUEST; //400 por defecto
    }

}
