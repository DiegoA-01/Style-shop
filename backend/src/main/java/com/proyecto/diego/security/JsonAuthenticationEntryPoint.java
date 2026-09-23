package com.proyecto.diego.security;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Sin este entry point, Spring Security responde 403 (Forbidden) a una
 * petición sin token o con token inválido/vencido, en vez de 401
 * (Unauthorized). El frontend necesita 401 específicamente para saber
 * que debe cerrar la sesión local y mandar al usuario a /login.
 *
 * Se escribe el JSON a mano (mismo shape que GlobalResponseDTO) para no
 * depender de Jackson, que aquí solo está en el classpath en scope runtime.
 */
@Component
public class JsonAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"message\":\"Debes iniciar sesión para acceder a este recurso\",\"data\":null}");
    }
}
