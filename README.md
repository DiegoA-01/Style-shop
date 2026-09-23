# Proyecto Final — Style Shop

Aplicación full-stack para gestionar un catálogo de productos y categorías, con autenticación JWT.

- **Backend**: Spring Boot (Java 21) → `http://localhost:8080/api/v1`
- **Frontend**: Angular 22 (standalone) → `http://localhost:4200`

## Dependencias del Backend (`backend/pom.xml`)

| Dependencia | Uso |
|---|---|
| `spring-boot-starter-webmvc` | API REST (controllers, endpoints HTTP) |
| `spring-boot-starter-data-jpa` | Persistencia con JPA/Hibernate |
| `mysql-connector-j` | Driver de conexión a MySQL |
| `spring-boot-starter-validation` | Validación de DTOs (`@NotBlank`, `@Positive`, etc.) |
| `spring-boot-starter-security` | Seguridad, filtros de autenticación, CORS |
| `io.jsonwebtoken:jjwt-api` / `jjwt-impl` / `jjwt-jackson` (0.12.6) | Generación y validación de tokens JWT |
| `lombok` | Reduce boilerplate (getters/setters, constructores) |
| `spring-boot-devtools` | Recarga automática en desarrollo |
| `spring-boot-starter-data-jpa-test` / `validation-test` / `webmvc-test` | Dependencias de testing |

Build con **Maven** (`mvnw`).

## Dependencias del Frontend (`frontend/package.json`)

| Dependencia | Uso |
|---|---|
| `@angular/core`, `@angular/common`, `@angular/compiler`, `@angular/platform-browser` | Núcleo de Angular 22 |
| `@angular/forms` | Reactive Forms (login, registro, formularios de producto/categoría) |
| `@angular/router` | Enrutamiento con lazy loading y guards |
| `rxjs` | Observables para las peticiones HTTP |
| `tslib` | Helpers de TypeScript |
| `@angular/build`, `@angular/cli`, `@angular/compiler-cli` (dev) | Build y tooling de Angular |
| `typescript` (dev) | Lenguaje |
| `vitest`, `jsdom` (dev) | Tests unitarios |
| `prettier` (dev) | Formateo de código |

Gestor de paquetes: **Bun** (`bun.lock`).

## Endpoints que conectan Frontend ↔ Backend

Base URL configurada en el frontend (`src/environments/enviroments.development.ts` → `apiUrl`): `http://localhost:8080/api/v1`

### Autenticación — `AuthService` (frontend) ↔ `AuthController` (backend)

| Método | Endpoint | Frontend | Descripción |
|---|---|---|---|
| POST | `/auth/register` | `AuthService.register()` | Crea usuario y devuelve JWT |
| POST | `/auth/login` | `AuthService.login()` | Login, devuelve JWT |

### Categorías — `CategoryService` (frontend) ↔ `CategoryController` (backend)

| Método | Endpoint | Frontend | Descripción |
|---|---|---|---|
| GET | `/category` | `getCategories()` | Lista categorías |
| GET | `/category/{id}` | `getCategory(id)` | Obtiene una categoría |
| POST | `/category` | `createCategory()` | Crea categoría |
| PUT | `/category/{id}` | `updateCategory()` | Actualiza categoría |
| DELETE | `/category/{id}` | `deleteCategory()` | Elimina categoría |

### Productos — `ProductService` (frontend) ↔ `ProductController` (backend)

| Método | Endpoint | Frontend | Descripción |
|---|---|---|---|
| GET | `/product` | `getProducts()` | Lista productos |
| GET | `/product/{id}` | `getProduct(id)` | Obtiene un producto |
| POST | `/product` | `createProduct()` | Crea producto |
| PUT | `/product/{id}` | `updateProduct()` | Actualiza producto |
| DELETE | `/product/{id}` | `deleteProduct()` | Elimina producto |
| POST | `/product/upload-image` | `uploadImage(file)` | Sube imagen (multipart/form-data), devuelve URL pública |

Todas las rutas excepto `/auth/**` y `/uploads/**` requieren el header `Authorization: Bearer <token>`, que agrega automáticamente el `authInterceptor` del frontend. Todas las respuestas exitosas del backend llegan envueltas en `GlobalResponseDTO<T>` (`{ message, data }`).

Más detalle de arquitectura en [backend/README.md](backend/README.md) y [frontend/README.md](frontend/README.md).
