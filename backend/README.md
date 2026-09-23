# Backend "Diego" — API de Productos y Categorías

> **Nota para futuros análisis:** este README ya documenta completamente la arquitectura, la lógica y el flujo del backend. Cuando se pida "analiza el proyecto", usa este documento como fuente de verdad en lugar de releer todo el código fuente desde cero.

## 1. Qué es este proyecto

Es una **API REST** hecha con **Spring Boot (Java 21)** que sirve de backend para una aplicación Angular (corriendo en `http://localhost:4200`). Gestiona dos recursos de negocio:

- **Categorías** (`Category`)
- **Productos** (`Product`), cada uno pertenece a una categoría

También permite **subir imágenes** de productos y servirlas como archivos estáticos, y tiene **autenticación con JWT** (registro/login de usuarios): toda la API queda protegida detrás de un login excepto `/auth/**` y las imágenes estáticas.

Aunque la carpeta está dentro de una ruta que menciona "Angular" y "TypeScript", **este subproyecto (`backend/`) es 100% Java/Spring Boot**, no Node/TypeScript. El frontend Angular vive en otra carpeta hermana y consume esta API por HTTP.

## 2. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Lenguaje | Java 21 |
| Framework | Spring Boot 4.1.1 (`spring-boot-starter-parent`) |
| Web | `spring-boot-starter-webmvc` (API REST clásica, Spring MVC) |
| Persistencia | `spring-boot-starter-data-jpa` + Hibernate |
| Base de datos | MySQL (`mysql-connector-j`) |
| Validación | `spring-boot-starter-validation` (Bean Validation / Jakarta Validation) |
| Seguridad | `spring-boot-starter-security` + JWT (`io.jsonwebtoken:jjwt-*` 0.12.6) |
| Boilerplate | Lombok (`@Getter`, `@Setter`, `@Data`, `@Builder`, `@RequiredArgsConstructor`, etc.) |
| Build | Maven (`pom.xml`, wrapper `mvnw` / `mvnw.cmd`) |
| Hot reload en dev | `spring-boot-devtools` |

## 3. Cómo arrancar el proyecto

1. Tener MySQL corriendo en `localhost:3306` con una base de datos llamada `products_diego`.
2. Ajustar usuario/contraseña en [`src/main/resources/application.yaml`](src/main/resources/application.yaml) si no usas `root`.
   - ⚠️ Ese archivo tiene la contraseña de la base de datos escrita en texto plano. En un entorno real esto debería ir en variables de entorno, no versionado en el repo.
3. Ejecutar:
   ```bash
   ./mvnw spring-boot:run
   ```
4. La API queda disponible en:
   ```
   http://localhost:8080/api/v1
   ```
   (el `context-path: /api/v1` se define en `application.yaml`, así que **todas** las rutas de abajo van precedidas por ese prefijo).

`spring.jpa.hibernate.ddl-auto: update` significa que **Hibernate crea/actualiza las tablas automáticamente** a partir de las entidades Java al arrancar — no hay migraciones SQL manuales (no hay Flyway/Liquibase).

## 4. Arquitectura por capas

El proyecto sigue el patrón clásico en capas de Spring, separado por paquete bajo `com.proyecto.diego`:

```
DiegoApplication.java        → punto de entrada (main)
│
├── config/                  → configuración transversal de Spring
│   ├── SecurityConfig.java  → CORS + reglas de autorización + cadena de filtros JWT
│   └── WebConfig.java       → expone la carpeta de uploads como recurso estático
│
├── security/                 → todo lo relacionado a JWT y autenticación
│   ├── JwtService.java              → genera/valida/lee el token
│   ├── JwtAuthenticationFilter.java → intercepta cada request, autentica si hay Bearer token válido
│   ├── CustomUserDetailsService.java→ carga un User de la BD como UserDetails de Spring Security
│   └── JsonAuthenticationEntryPoint.java → responde 401 (en vez del 403 por defecto) si no hay token
│
├── controller/               → capa HTTP (recibe requests, delega al service, arma la respuesta)
│   ├── AuthController.java
│   ├── CategoryController.java
│   └── ProductController.java
│
├── service/                   → lógica de negocio (validaciones, reglas, orquestación)
│   ├── AuthService.java
│   ├── CategoryService.java
│   └── ProductService.java
│
├── repository/                → acceso a datos (interfaces JPA, sin implementación manual)
│   ├── UserRepository.java
│   ├── CategoryRespository.java
│   └── ProductsRepository.java
│
├── entity/                    → modelo de datos persistente (mapeado 1:1 a tablas SQL)
│   ├── User.java
│   ├── Category.java
│   └── Product.java
│
├── dto/
│   ├── Request/                → lo que el cliente envía (con validaciones @NotBlank, @Positive, etc.)
│   │   ├── LoginRequestDTO.java
│   │   ├── RegisterRequestDTO.java
│   │   ├── CategoryRequestDTO.java
│   │   └── ProductRequestDTO.java
│   └── Response/                → lo que la API devuelve (nunca se expone la entidad JPA directamente)
│       ├── AuthResponseDTO.java      → { token, username } que se devuelve al hacer login/register
│       ├── CategoryResponseDTO.java
│       ├── CategorySummaryDTO.java   → versión resumida de categoría (id + name), usada dentro de ProductResponseDTO
│       ├── ProductResponseDTO.java
│       └── GlobalResponseDTO.java    → wrapper genérico { message, data } para TODAS las respuestas
│
└── exception/
    └── GlobalExceptionHandler.java  → convierte excepciones en respuestas HTTP con status correcto
```

**Regla de flujo (siempre igual, para ambos recursos):**

```
Cliente (Angular)
   │  HTTP request (JSON)
   ▼
Controller        → valida forma del request (@Valid), delega
   │  DTO Request
   ▼
Service           → reglas de negocio, transforma DTO ↔ Entity
   │  Entity
   ▼
Repository (JPA)   → SQL generado por Hibernate contra MySQL
   ▼
Entity ──► Service la convierte a DTO Response ──► Controller la envuelve en GlobalResponseDTO ──► Cliente
```

Ningún controller ni cliente ve nunca una `Entity` de JPA directamente: siempre se traduce a un DTO. La traducción la hace un método `toResponse(...)` dentro de cada Service.

## 5. Modelo de datos

### `User`
- `id` (Long, autoincremental)
- `username` (String, **único**, obligatorio)
- `email` (String, **único**, obligatorio)
- `password` (String, hash BCrypt — **nunca** se guarda ni se devuelve en texto plano)

### `Category`
- `id` (Long, autoincremental)
- `name` (String, **único**, obligatorio)
- `description` (String, hasta 255, columna `descripcion`)
- `products` (relación `@OneToMany`, una categoría tiene muchos productos)

### `Product`
- `id` (Long, autoincremental)
- `name` (String, obligatorio, máx 100)
- `description` (String, máx 500)
- `price` (BigDecimal, obligatorio)
- `stock` (Integer, obligatorio)
- `category` (relación `@ManyToOne` hacia `Category`, carga perezosa `FetchType.LAZY`)
- `createdAt` (LocalDateTime, se asigna automáticamente en el servidor vía `@PrePersist`, el cliente nunca la manda)
- `imageUrl` (String, URL pública de la imagen subida)

Relación: **una categoría tiene muchos productos**; **un producto pertenece a una sola categoría** (obligatoria, `nullable = false`).

## 6. Endpoints disponibles

Prefijo base para todos: `http://localhost:8080/api/v1`

### Autenticación — `/auth` (únicas rutas públicas, no requieren token)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Crea un usuario nuevo (`username`, `email`, `password`) y devuelve un JWT ya logueado |
| POST | `/auth/login` | Verifica `username` + `password` y devuelve un JWT |

Ambas devuelven `AuthResponseDTO`: `{ "token": "...", "username": "..." }`.

### Categorías — `/category` (requiere `Authorization: Bearer <token>`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/category` | Crea una categoría (falla si el nombre ya existe) |
| GET | `/category` | Lista todas las categorías |
| GET | `/category/{id}` | Obtiene una categoría por id |
| PUT | `/category/{id}` | Actualiza nombre/descripción de una categoría |
| DELETE | `/category/{id}` | Elimina una categoría (falla si tiene productos asociados) |

### Productos — `/product` (requiere `Authorization: Bearer <token>`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/product/upload-image` | Sube un archivo de imagen (`multipart/form-data`, campo `file`), devuelve la URL pública |
| POST | `/product` | Crea un producto (requiere `categoryId` existente) |
| GET | `/product` | Lista todos los productos |
| GET | `/product/{id}` | Obtiene un producto por id |
| PUT | `/product/{id}` | Actualiza un producto (puede cambiar de categoría) |
| DELETE | `/product/{id}` | Elimina un producto |

### Formato de respuesta (siempre igual)

Todas las respuestas —éxito o error— usan el mismo sobre `GlobalResponseDTO<T>`:

```json
{
  "message": "Producto creado con exito",
  "data": { "id": 1, "name": "...", "price": 10.0, "...": "..." }
}
```

## 7. Flujo de subida de imágenes

Este es el flujo más particular del proyecto porque involucra archivos, no solo JSON:

1. El frontend hace `POST /product/upload-image` con el archivo como `multipart/form-data`.
2. `ProductController.uploadImage` recibe el `MultipartFile` y llama a `ProductService.uploadImage`.
3. `ProductService`:
   - Verifica que el archivo no esté vacío.
   - Crea la carpeta `uploads/products` si no existe (ruta configurada en `app.upload.dir`).
   - Genera un nombre único con `UUID` + la extensión original (evita colisiones de nombres).
   - Copia el archivo físicamente al disco.
   - Devuelve la URL pública completa: `http://localhost:8080/api/v1/uploads/products/<uuid>.jpg` (usando `app.base-url`).
4. El frontend guarda esa URL como `imageUrl` cuando crea o actualiza el producto (`POST`/`PUT /product`) — es un paso **separado**, subir la imagen no crea el producto por sí solo.
5. Para que esa URL sea accesible como imagen estática, `WebConfig` registra un *resource handler*: cualquier request a `/uploads/products/**` se resuelve leyendo el archivo físico desde la carpeta `uploads/products/`.

En resumen: **subir imagen y crear/editar producto son dos llamadas HTTP distintas**; la imagen ya vive en el servidor de archivos antes de que el producto exista en la base de datos.

## 8. Autenticación y seguridad (JWT)

Todo pasa por `SecurityConfig` (`config/SecurityConfig.java`). Reglas de autorización:

- `/auth/**` → público (login/register).
- `/uploads/**` → público. Es intencional: las imágenes se piden con `<img src="...">`, que el navegador resuelve directamente sin pasar por el interceptor HTTP de Angular, así que **nunca** pueden llevar el header `Authorization`. Si se protegieran, las imágenes de producto se romperían en el frontend.
- Cualquier otra ruta (`/category/**`, `/product/**`) → requiere JWT válido.

**Flujo de registro:**
1. `POST /auth/register` con `{ username, email, password }` → `AuthController.register` → `AuthService.register`.
2. `AuthService` valida que `username` y `email` no existan ya, hashea el password con `BCryptPasswordEncoder` y guarda el `User`.
3. Genera un JWT (`JwtService.generateToken`) y lo devuelve junto al username — **el usuario queda logueado automáticamente al registrarse**, sin necesidad de un segundo login.

**Flujo de login:**
1. `POST /auth/login` con `{ username, password }` → `AuthService.login` delega en el `AuthenticationManager` de Spring Security (que usa `CustomUserDetailsService` + el mismo `BCryptPasswordEncoder` para comparar el hash).
2. Si las credenciales no coinciden, lanza `BadCredentialsException` (ver sección 9, se traduce a 401).
3. Si coinciden, genera y devuelve un JWT igual que en el registro.

**Flujo de una request autenticada (`GET /category`, etc.):**
1. El cliente manda el header `Authorization: Bearer <token>`.
2. `JwtAuthenticationFilter` (se ejecuta en cada request, antes de que Spring Security decida si autoriza o no) lee el header, valida el token con `JwtService.isTokenValid` y, si es válido, carga el usuario con `CustomUserDetailsService` y lo pone en el `SecurityContext`.
3. Si no hay token, el token es inválido o está vencido, la request sigue **sin autenticar**. Como la ruta pedida no es `/auth/**` ni `/uploads/**`, Spring Security la rechaza y `JsonAuthenticationEntryPoint` responde `401` con el mismo formato `{ message, data: null }` que el resto de la API (sin este entry point personalizado, Spring Security respondería `403` por defecto).

**Detalles del JWT** (`security/JwtService.java`):
- Algoritmo HS256, firmado con el secreto en `app.jwt.secret` (`application.yaml`).
- Expira a las 24h (`app.jwt.expiration-ms: 86400000`).
- El `subject` del token es el `username`; no lleva roles ni otra información (todo usuario autenticado tiene el mismo nivel de acceso, no hay ADMIN vs USER en este proyecto).
- ⚠️ El secreto está hardcodeado en `application.yaml`, igual que la contraseña de MySQL — mismo comentario que en la sección 3: en un entorno real debería ir en una variable de entorno, y **rotarlo invalida todos los tokens emitidos** (todos los usuarios tendrían que volver a loguearse).

## 9. Validaciones y reglas de negocio

Validaciones de forma (Jakarta Validation, se disparan con `@Valid` en el controller y devuelven 400 si fallan):
- Usuario: `username` (3–50 caracteres), `email` (formato válido), `password` (mín. 6 caracteres) — todos obligatorios.
- Categoría: `name` obligatorio (2–50 caracteres), `description` opcional (máx 255).
- Producto: `name` obligatorio, `price` obligatorio y positivo, `stock` obligatorio y ≥ 0, `categoryId` obligatorio.

Reglas de negocio (viven en los Services, lanzan `RuntimeException` con mensajes en español):
- No se puede registrar un `username` o `email` que ya exista.
- No se puede crear una categoría con un `name` que ya exista.
- No se puede eliminar una categoría si tiene productos asociados (`ProductsRepository.existsByCategoryId`).
- No se puede crear/actualizar un producto con una `categoryId` que no exista.
- Cualquier `findById` que no encuentre el registro lanza `RuntimeException("... no encontrada/o")`.

## 10. Manejo de errores

No hay excepciones personalizadas para el negocio: **todo lanza `RuntimeException` con un mensaje de texto**, y `GlobalExceptionHandler` (un `@RestControllerAdvice` global) intercepta *cualquier* `RuntimeException` de la aplicación y decide el código HTTP **leyendo palabras clave del mensaje**:

| El mensaje contiene... | HTTP Status |
|---|---|
| "no encontrada" / "no encontrado" | 404 Not Found |
| "ya existe" / "no se puede eliminar" | 409 Conflict |
| cualquier otro caso | 400 Bad Request |
| mensaje nulo | 500 Internal Server Error |

Esto es un patrón simple pero frágil: si en el futuro se cambia el texto de un mensaje de error, se puede romper silenciosamente el código de estado HTTP devuelto (por ejemplo, si "no encontrada" se escribe distinto, dejaría de mapear a 404). Tenlo en cuenta antes de tocar los mensajes de error en los Services.

Por encima de esa regla genérica hay un handler más específico para errores de autenticación: `AuthenticationException` (la lanza Spring Security, por ejemplo `BadCredentialsException` en un login fallido) siempre se traduce a **401** con el mensaje "Usuario o contraseña incorrectos", nunca pasa por la tabla de palabras clave de arriba.

## 11. CORS y configuración de red

- El CORS ya no vive en un `WebMvcConfigurer` separado: ahora es parte de `SecurityConfig` (bean `CorsConfigurationSource`), porque Spring Security intercepta las requests antes que Spring MVC y necesita su propia configuración de CORS para no bloquearlas.
- Permite explícitamente peticiones **solo** desde `http://localhost:4200` (el Angular en desarrollo), con métodos `GET, POST, PUT, DELETE, OPTIONS` y cualquier header.
- Si el frontend se despliega en otro origen (producción), esta configuración debe actualizarse o se bloquearán las peticiones.

## 12. Puntos débiles / cosas a tener en mente si vas a modificar el código

- La contraseña de la base de datos y el secreto JWT están hardcodeados en `application.yaml` (no hay perfiles `dev`/`prod` ni variables de entorno).
- No hay roles/permisos: cualquier usuario logueado tiene acceso total a `/category` y `/product` (no existe distinción admin vs usuario normal).
- No hay logout real en el servidor: como el JWT es stateless, "cerrar sesión" solo borra el token en el frontend (`localStorage`); el token sigue siendo válido hasta que expire si alguien lo captura antes de que el usuario cierre sesión. No hay blacklist de tokens revocados.
- El manejo de errores de negocio se basa en parsear texto del mensaje (ver sección 10), no en tipos de excepción — es propenso a errores si se traduce o reformula un mensaje.
- No hay tests de negocio reales (`DiegoApplicationTests.java` es el test por defecto generado por Spring Initializr, solo verifica que el contexto levante).
- Al eliminar un producto no se borra su imagen física asociada en `uploads/products/` (queda huérfana en disco).

## 13. Cómo usar este README en el futuro

Cuando se pida analizar, entender o modificar este backend, referirse a las secciones de arriba en lugar de releer todo el árbol de archivos:
- ¿Dónde está la lógica de X endpoint? → Sección 6 (tabla de endpoints) + Sección 4 (mapa de capas) te dice en qué archivo mirar.
- ¿Cómo se relacionan las entidades? → Sección 5.
- ¿Cómo funciona el login/JWT? → Sección 8.
- ¿Por qué falla con tal código HTTP? → Sección 10.
- ¿Cómo funciona la subida de imágenes? → Sección 7.

Si el código cambia de forma significativa (nuevos endpoints, nuevas entidades, cambio de reglas de negocio), este README debe actualizarse para seguir siendo la fuente de verdad.
