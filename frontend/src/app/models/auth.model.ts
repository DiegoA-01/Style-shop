// TRABAJADOR se muestra como "Empleado" en la interfaz.
export type Role = 'SUPER_ADMIN' | 'TRABAJADOR' | 'CAJERO' | 'USUARIO';

// Lo que se envía al hacer login (LoginRequestDTO)
export interface LoginRequest {
  username: string;
  password: string;
}

// Lo que se envía al registrarse (RegisterRequestDTO). El registro público
// siempre crea una cuenta USUARIO (sin permisos de catálogo); el backend
// ignora cualquier rol que se intente mandar desde acá.
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// Lo que devuelve el backend tras login (AuthResponseDTO)
export interface AuthResponse {
  token: string;
  username: string;
  role: Role;
}
