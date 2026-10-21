package com.proyecto.diego.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.proyecto.diego.security.CustomUserDetailsService;
import com.proyecto.diego.security.JsonAccessDeniedHandler;
import com.proyecto.diego.security.JsonAuthenticationEntryPoint;
import com.proyecto.diego.security.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

/**
 * Reemplaza al antiguo CorsConfig: con Spring Security en el classpath,
 * el CORS y las reglas de autorización de rutas se configuran juntos aquí.
 *
 * Reglas de acceso (roles fijos, ver Role):
 * - Públicos: /auth/login, /auth/register, los GET de /product y /category,
 *   y POST /orders (el pedido web nace PENDIENTE). El registro público siempre
 *   crea cuentas USUARIO; nadie puede auto-asignarse un rol de personal.
 * - Catálogo (crear/editar/eliminar productos y categorías, subir imágenes):
 *   TRABAJADOR ("Empleado") o SUPER_ADMIN.
 * - Ventas (ver pedidos, cobrar, anular, vender en mostrador): CAJERO o SUPER_ADMIN.
 * - Cuentas (/users/**) y estadísticas (/reports/**): solo SUPER_ADMIN.
 * Un USUARIO autenticado no tiene ninguno de estos permisos: ve el catálogo
 * igual que un visitante.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;
    private final JsonAuthenticationEntryPoint authenticationEntryPoint;
    private final JsonAccessDeniedHandler accessDeniedHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Spring reenvía los errores (p. ej. validación fallida) a /error: si esa
                // ruta exigiera sesión, un 400 de datos inválidos llegaría como 401.
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.POST, "/auth/login", "/auth/register").permitAll()
                // Las imágenes son <img src="..."> servidas directamente por el navegador:
                // nunca llevan el header Authorization, así que no pueden exigir JWT.
                .requestMatchers("/uploads/**").permitAll()
                // Catálogo público: cualquiera puede ver productos y categorías sin cuenta.
                .requestMatchers(HttpMethod.GET, "/product/**", "/category/**").permitAll()
                // Checkout público: cualquier visitante puede confirmar un pedido sin cuenta.
                .requestMatchers(HttpMethod.POST, "/orders").permitAll()
                // Ventas: la cola de pedidos, cobrar, anular y vender en mostrador.
                .requestMatchers("/orders", "/orders/**").hasAnyRole("CAJERO", "SUPER_ADMIN")
                // Administrar el catálogo (incluye /product/upload-image).
                .requestMatchers("/product/**", "/category/**").hasAnyRole("TRABAJADOR", "SUPER_ADMIN")
                // Gestión de cuentas y estadísticas de venta: exclusivas del super admin.
                .requestMatchers("/users/**", "/reports/**").hasRole("SUPER_ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:4200"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
