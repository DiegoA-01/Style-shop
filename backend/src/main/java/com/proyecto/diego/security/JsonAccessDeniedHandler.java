package com.proyecto.diego.security;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Se dispara cuando hay un JWT válido pero el rol del usuario no alcanza
 * (p. ej. un TRABAJADOR intentando entrar a /users/**). Sin este handler,
 * Spring Security responde con su página de error 403 por defecto en vez
 * del mismo shape { message, data } que usa el resto de la API.
 */
@Component
public class JsonAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException)
            throws IOException {

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"message\":\"No tienes permisos para acceder a este recurso\",\"data\":null}");
    }
}
