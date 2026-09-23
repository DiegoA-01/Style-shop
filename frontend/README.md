# Style Shop — Frontend

SPA en Angular 22 (standalone, sin NgModules) para gestionar un catálogo de productos y categorías de ropa, con autenticación, consumiendo una API REST backend.

> **Nota para Claude Code / IA**: este documento describe la arquitectura completa del proyecto. Antes de releer todo el código fuente para responder una pregunta de arquitectura, consulta primero este archivo. Si haces cambios que alteren la arquitectura (rutas, servicios, modelos, páginas, interceptores, convenciones, flujo de datos), actualiza este README en la misma tarea.

## Stack tecnológico

- **Angular 22** — componentes standalone, sin NgModules.
- **TypeScript ~6.0**
- **RxJS** para los observables de HTTP.
- **Angular Router** con lazy loading vía `loadComponent` en todas las rutas, y un `CanActivateFn` (`authGuard`) protegiendo las rutas privadas.
- **Angular Reactive Forms** (`FormBuilder`, `Validators`, validador cruzado a nivel de `FormGroup` en el registro).
- **Angular HttpClient** + interceptores funcionales encadenados (`HttpInterceptorFn`): auth, loading y logging.
- **Signals** (`signal`, `input`, `output`, `computed`) para el estado local y los servicios de estado compartido (`AuthService`, `LoadingService`, `ToastService`) — no hay librería de estado global (NgRx, etc.).
- **Vitest** para tests unitarios (`ng test`).
- **Bun** como package manager (`bun.lock`).
- CSS plano por componente sobre un sistema de **design tokens** (variables CSS en `styles.css`), estética "glass" (`app.css`), fondo animado tipo Ken Burns, y fuente Inter vía Google Fonts (`index.html`).

## Estructura de carpetas

```
src/
├── app/
│   ├── app.ts / app.html / app.css       # Shell raíz: nav + barra de progreso + <router-outlet> + toasts
│   ├── app.config.ts                      # Providers globales (router, http, interceptores)
│   ├── app.routes.ts                      # Definición de rutas (lazy, con authGuard)
│   ├── guards/
│   │   └── auth.guard.ts                  # CanActivateFn: bloquea rutas privadas si no hay sesión
│   ├── interceptors/
│   │   ├── auth.interceptor.ts            # Agrega Bearer token; logout automático en 401
│   │   ├── loading.interceptor.ts         # Alimenta LoadingService (barra de progreso global)
│   │   └── logging.interceptor.ts         # Log de todas las peticiones HTTP
│   ├── models/
│   │   ├── auth.model.ts                  # LoginRequest, RegisterRequest, AuthResponse
│   │   ├── product.model.ts               # Product, ProductRequest, CategorySummary
│   │   ├── category.model.ts              # Category, CategoryRequest
│   │   └── global-response.model.ts       # GlobalResponse<T> = { message, data }
│   ├── services/
│   │   ├── auth.service.ts                # login/register/logout, token+username en localStorage
│   │   ├── product.service.ts             # CRUD /product + upload-image
│   │   └── category.service.ts            # CRUD /category
│   ├── shared/
│   │   ├── loading.service.ts             # Contador de peticiones en vuelo -> isLoading()
│   │   ├── toast.service.ts               # Notificaciones success/error con auto-dismiss
│   │   ├── toast-container.ts / .css      # Renderiza los toasts activos (usa ToastService)
│   │   └── cop-currency.pipe.ts           # Pipe `copCurrency`: formatea precios en pesos colombianos
│   ├── utils/
│   │   └── category-image.util.ts         # Nombre de categoría -> ruta de imagen
│   └── pages/
│       ├── login/                         # Formulario de inicio de sesión
│       ├── register/                      # Formulario de registro (con validación de contraseñas iguales)
│       ├── product-list/                  # Listado de productos (con filtro por categoría vía query params)
│       ├── product-form/                  # Form de producto (crear/editar, embebido o standalone)
│       ├── category-list/                 # Listado de categorías (clic en una -> productos filtrados)
│       └── category-form/                 # Form de categoría (crear/editar, embebido o standalone)
├── environments/
│   ├── enviroments.ts                     # environment de producción
│   └── enviroments.development.ts         # environment de desarrollo
└── main.ts                                # bootstrapApplication(App, appConfig)

public/images/                             # Assets estáticos servidos tal cual (categorías, fondos hero)
```

## Bootstrap y configuración global (`app.config.ts`)

- `provideRouter(routes, withComponentInputBinding(), withPreloading(PreloadAllModules))`
  - `withComponentInputBinding()`: los parámetros de ruta (`:id`) **y los query params** (`?categoryId=`) llegan como `input()` del componente, no hay que leerlos manualmente de `ActivatedRoute`.
  - `withPreloading(PreloadAllModules)`: las rutas lazy se precargan en segundo plano tras el arranque.
- `provideHttpClient(withInterceptors([authInterceptor, loadingInterceptor, loggingInterceptor]))`: el **orden importa**:
  1. `authInterceptor` agrega el header `Authorization` antes que nada.
  2. `loadingInterceptor` marca la petición (ya autenticada) como "en curso".
  3. `loggingInterceptor` registra en consola la petición final que sale a red.

## Enrutamiento (`app.routes.ts`)

Todas las páginas son componentes standalone cargados de forma perezosa con `loadComponent`. `products`, `products/new`, `products/:id/edit`, `categories`, `categories/new` y `categories/:id/edit` tienen `canActivate: [authGuard]`.

| Ruta | Componente | Protegida | Uso |
|---|---|---|---|
| `''` | redirect → `products` | | |
| `login` | `Login` | No | Inicio de sesión |
| `register` | `Register` | No | Alta de cuenta |
| `products` | `ProductList` | Sí | Listado de productos (admite `?categoryId=&categoryName=`) |
| `products/new` | `ProductForm` | Sí | Alta de producto (standalone, navegado) |
| `products/:id/edit` | `ProductForm` | Sí | Edición de producto |
| `categories` | `CategoryList` | Sí | Listado de categorías |
| `categories/new` | `CategoryForm` | Sí | Alta de categoría |
| `categories/:id/edit` | `CategoryForm` | Sí | Edición de categoría |
| `**` | redirect → `products` | | |

Si no hay sesión, `authGuard` redirige a `/login` en vez de activar la ruta.

## Autenticación (`services/auth.service.ts`, `guards/auth.guard.ts`, `interceptors/auth.interceptor.ts`)

- **`AuthService`**: expone `currentUser = signal<string | null>(...)` inicializado leyendo `localStorage` (la sesión sobrevive a un refresh). `login()`/`register()` llaman a `POST /auth/login` y `POST /auth/register`; al éxito, `guardarSesion()` persiste `auth_token` y `auth_username` en `localStorage` y actualiza el signal. `logout()` limpia todo y navega a `/login`. `isLoggedIn()` = `!!getToken()`.
- **`authGuard`** (`CanActivateFn`): si `authService.isLoggedIn()` es `false`, redirige a `/login` y bloquea la navegación.
- **`authInterceptor`**: clona cada petición saliente agregando `Authorization: Bearer <token>` si hay uno guardado. Si el backend responde `401` en una ruta que no sea `/auth/...`, hace `logout()` y navega a `/login` (sesión expirada/token inválido).
- **`login`** / **`register`** (páginas): Reactive Forms simples; `register` agrega un validador a nivel de `FormGroup` (`passwordsIguales`) que compara `password` y `confirmPassword`. Al éxito de cualquiera de los dos, se navega a `/products`.

## Loading global y notificaciones (`shared/`)

- **`LoadingService`**: cuenta peticiones HTTP en vuelo (`start()`/`stop()`); `isLoading()` es `true` mientras haya al menos una pendiente.
- **`loadingInterceptor`**: llama `start()`/`stop()` alrededor de cada petición (vía `finalize`), sin importar el resultado.
- En `app.html`, `.top-progress` es una barra fija bajo el nav cuya clase `active` (ligada a `loadingService.isLoading()`) la anima; es la única señal global de "algo está cargando" en toda la app.
- **`ToastService`**: `success(mensaje)` / `error(mensaje)` agregan un toast a una lista (`signal<Toast[]>`) que se autodescarta a los 4s (`dismiss()` también se puede llamar a mano).
- **`ToastContainer`** (`<app-toast-container />`, montado una vez en `app.html`): renderiza la lista de `ToastService` con `aria-live="polite"`.
- Los flujos de guardar/eliminar en `product-list`, `category-list`, `product-form` y `category-form` llaman a `toastService.success(...)` / `.error(...)` tras cada operación, en vez de solo actualizar un signal `error` local.

## Modelos (`src/app/models`)

Reflejan los DTOs del backend:

- **`GlobalResponse<T>`**: envoltorio `{ message, data }` en el que llegan **todas** las respuestas exitosas del backend.
- **`Product`** (`ProductResponseDTO`): incluye `category: CategorySummary` anidada.
- **`ProductRequest`** (`ProductRequestDTO`): usa `categoryId` en vez de la categoría completa.
- **`Category`** / **`CategoryRequest`**: equivalentes para categorías.
- **`LoginRequest`** / **`RegisterRequest`** / **`AuthResponse`**: DTOs de autenticación (`AuthResponse` trae `token` + `username`).

## Servicios (`src/app/services`)

`ProductService` y `CategoryService` siguen el mismo patrón:

- `baseUrl = environment.apiUrl + '/product'` (o `/category`).
- Un método por operación REST (`getProducts`, `getProduct`, `createProduct`, `updateProduct`, `deleteProduct`) que devuelve `Observable<GlobalResponse<T>>`.
- `handleError` centralizado: extrae `error.error?.message` (el mensaje que ya formatea el `GlobalExceptionHandler` del backend) o usa un mensaje genérico.
- `ProductService` además expone `uploadImage(file: File)`: arma un `FormData` y hace `POST /product/upload-image`, devolviendo la URL final de la imagen.

`AuthService` sigue el mismo patrón de `handleError`, pero además persiste sesión en `localStorage` (ver sección de Autenticación).

## Interceptores HTTP (`interceptors/`)

Registrados en `app.config.ts` en este orden: `authInterceptor` → `loadingInterceptor` → `loggingInterceptor` (ver [Bootstrap](#bootstrap-y-configuración-global-appconfigts) para el porqué del orden).

## Utilidades (`src/app/utils`, `src/app/shared`)

- **`getCategoryImage(categoryName)`** (`utils/category-image.util.ts`): normaliza el nombre (minúsculas, sin tildes), lo pasa por un diccionario de alias singular/plural (ej. `camisa`/`camisetas` → `camisetas`) y devuelve `/images/categories/{nombre}.jpg`. Se usa como imagen de producto/categoría cuando no hay una propia, y como fallback si la configurada no carga.
- **`CopCurrencyPipe`** (`shared/cop-currency.pipe.ts`, pipe `copCurrency`): formatea números como pesos colombianos con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })`, usado en `product-list` y `product-form` para mostrar/previsualizar precios.

## Páginas (`src/app/pages`)

Cada feature es una carpeta con `.ts` + `.html` + `.css`, componente standalone, sin módulo propio.

### `login` / `register`

Formularios simples con `ReactiveFormsModule`. `register` valida email (`Validators.email`), longitud mínima de contraseña y que `password` == `confirmPassword` (validador de grupo). Ambos muestran `error` (mensaje del backend) y un estado `cargando` para deshabilitar el botón mientras la petición está en curso. Al éxito navegan a `/products`.

### Listados (`product-list`, `category-list`)

- Cargan los datos en `ngOnInit` y manejan `cargando` / `error` con signals.
- Borrado en dos pasos: `eliminar(id)` marca el candidato (`productoAEliminar` / `categoriaAEliminar`) → `confirmarEliminacion()` ejecuta el DELETE (y dispara un toast de éxito/error), `cancelarEliminacion()` lo descarta. Un listener `@HostListener('document:keydown.escape')` cierra el modal que esté abierto (formulario o confirmación).
- **"Nuevo" no navega**: activa `mostrarFormulario = true` y embebe el `*-form` correspondiente inline (`<app-product-form [embedded]="true">`), evitando una navegación completa para crear un registro.
- **"Editar" sí navega**: usa `routerLink` a `.../:id/edit`, que carga el mismo formulario pero como página standalone (`embedded=false`) vía `loadComponent`.
- Al guardar desde el modo embebido, el listener del evento `(saved)` (`productoGuardado()` / `categoriaGuardada()`) cierra el formulario y recarga la lista.

#### Filtro de productos por categoría (click en una categoría)

- En `category-list`, cada tarjeta (`.category-card`) es clickeable (`role="button"`, `tabindex="0"`, soporte de `Enter`) y llama a `verProductos(category)`, que navega con `router.navigate(['/products'], { queryParams: { categoryId, categoryName } })`. Los botones "Editar"/"Eliminar" siguen funcionando porque su contenedor hace `(click)="$event.stopPropagation()"`.
- En `product-list`, `categoryId` (`input<number, string>` con `numberAttribute`) y `categoryName` (`input<string>`) reciben esos query params automáticamente gracias a `withComponentInputBinding()`. Un `computed` (`productosFiltrados`) filtra `products()` por `p.category.id === categoryId()` cuando hay filtro activo; si no, muestra todos.
- Cuando hay un `categoryId` en la URL se muestra una barra ("Categoría: **Gorras** · Ver todos los productos") con un link a `/products` (sin query params) para quitar el filtro. El mensaje de "vacío" también cambia entre "no hay productos todavía" y "no hay productos en esta categoría todavía".

### Formularios (`product-form`, `category-form`)

Un mismo componente sirve para **crear** y **editar**, y para uso **embebido** o **standalone**:

- `id = input<number, string>(..., { transform: numberAttribute })`: si el router pasa un `:id`, se precarga el registro (modo edición); si no, es alta.
- `embedded = input(false)`: si es `true` (usado desde el listado), al guardar emite `saved.emit()` en vez de navegar, y `cerrar()` emite `closed.emit()`. Si es `false` (ruta standalone `/new` o `/:id/edit`), al guardar navega con `Router` a la lista.
- Reactive Forms (`FormBuilder` + `Validators`). Un signal `guardando` deshabilita el botón de guardar mientras la petición está en curso, y al terminar se dispara un toast de éxito ("Producto/Categoría creado/actualizado correctamente") o el mensaje de error del backend.
- `product-form` además gestiona la imagen del producto:
  1. `onFileSelected`: guarda el `File`, muestra preview local instantánea vía `FileReader`, y sube el archivo con `ProductService.uploadImage`.
  2. La URL que devuelve el backend se guarda en el signal `imageUrl` y es la que se manda como `imageUrl` del `ProductRequest` al guardar.
  3. En edición, si el producto ya tenía imagen, se reutiliza como preview inicial.
  4. El precio se previsualiza con el pipe `copCurrency`.

## Estilos y diseño (`styles.css`, `app.css`)

- **Design tokens** (`styles.css`, `:root`): colores (`--color-bg`, `--color-surface`, `--color-accent`, `--color-danger`, ...), radios (`--radius-sm/md/lg`), espaciados (`--space-1..4`) y timings (`--ease`, `--duration`, `--duration-fast`). Cualquier ajuste de estilo global se hace ahí, no repitiendo valores en cada componente.
- Animaciones reutilizables definidas una vez en `styles.css`: `fade-in`, `rise-in`, `pop-in`, `spin` (con clase `.spinner`), y una regla `@media (prefers-reduced-motion: reduce)` que anula duraciones para quien lo prefiera.
- Tipografía **Inter** cargada desde Google Fonts en `index.html`.
- `app.css` implementa el shell "liquid glass": `.page-background::before` pinta la foto de fondo (`hero-bg4.jpg`) con un degradado oscuro encima (para que el texto/tarjetas tengan contraste) y una animación `bg-drift` tipo Ken Burns (zoom + paneo lentísimo en bucle, 26s, `alternate`), también respetando `prefers-reduced-motion`. El nav (`.glass-nav`) es `position: sticky`, con blur/backdrop-filter, logo SVG + "Style Shop", y una `.top-progress` (barra de carga) fija bajo él.

## Entornos (`src/environments`)

- `enviroments.ts` (producción) y `enviroments.development.ts` (desarrollo) — nombre de archivo con la errata "enviroments" (sin la "n" de "environment"), no es un typo a corregir por sorpresa: los imports ya apuntan a ese nombre en todo el proyecto.
- **Todos los servicios (`AuthService`, `ProductService`, `CategoryService`) importan directamente `../../environments/enviroments.development`**, no hay `fileReplacements` configurados en `angular.json`. Es decir, hoy en día el proyecto siempre usa el environment de desarrollo, incluso en un build de producción. Si algún día se despliega, hay que decidir entre configurar `fileReplacements` o cambiar el import a `enviroments.ts`.
- `apiUrl` actual: `http://localhost:8080/api/v1`.

## Flujo de datos de ejemplo: crear un producto desde el listado

1. En `ProductList`, el usuario pulsa "Nuevo" → `abrirFormulario()` → `mostrarFormulario.set(true)` → se renderiza `<app-product-form [embedded]="true">` inline.
2. `ProductForm.ngOnInit` pide las categorías (`CategoryService.getCategories`) para poblar el `<select>`.
3. El usuario elige una imagen → `onFileSelected` sube el archivo (`ProductService.uploadImage`) y guarda la URL devuelta en `imageUrl`.
4. El usuario completa el resto del form y pulsa guardar → `guardar()` arma el `ProductRequest` (incluyendo `imageUrl`) y, como `embedded()` es `true`, llama a `ProductService.createProduct(datos)`; al éxito muestra un toast y emite `saved`.
5. `ProductList` escucha `(saved)="productoGuardado()"` → cierra el formulario y vuelve a llamar `cargarProductos()` para refrescar la lista.

Cada petición de este flujo pasa antes por `authInterceptor` (agrega el token), `loadingInterceptor` (prende la barra de progreso) y `loggingInterceptor` (la loguea). Todas las respuestas exitosas del backend llegan envueltas en `GlobalResponse<T>` (`{ message, data }`); los errores se capturan en `handleError` de cada servicio, que asume un `GlobalExceptionHandler` en el backend devolviendo `{ message }`.

## Convenciones del proyecto

- Componentes standalone únicamente, no se usan NgModules.
- Nombres de métodos/propiedades de UI en **español** (`cargarProductos`, `guardar`, `eliminar`, `mostrarFormulario`), mientras que el código de infraestructura (servicios, modelos, interceptores, guards, nombres de archivo) está en **inglés**.
- Estado local de componente y estado compartido simple con **signals** (`computed` incluido); no hay una librería de estado global.
- Todas las rutas de página usan `loadComponent` (lazy loading), incluso siendo pocas páginas.
- Errores de red se comunican al usuario con `ToastService`, no con `alert()` ni silenciosamente.
- Estilos: nada de valores mágicos repetidos — colores/espaciados/timings van en los design tokens de `styles.css`.

## Comandos

```bash
bun install       # instalar dependencias (o npm install)
ng serve          # servidor de desarrollo → http://localhost:4200
ng build          # build de producción en dist/
ng test           # tests unitarios con Vitest
```

## Backend esperado

No está incluido en este repo. Se espera una API REST en `http://localhost:8080/api/v1` con, al menos:

- `POST /auth/login`, `POST /auth/register` → `GlobalResponse<AuthResponse>` (`{ token, username }`).
- `GET/POST /product`, `GET/PUT/DELETE /product/:id`, `POST /product/upload-image` (multipart).
- `GET/POST /category`, `GET/PUT/DELETE /category/:id`.
- Todas las respuestas exitosas envueltas en `GlobalResponseDTO<T>` (`{ message, data }`).
- Errores con un campo `message` legible (vía un `GlobalExceptionHandler`), y `401` para token inválido/expirado (lo escucha `authInterceptor`).
