// Lo que se envía al hacer login (LoginRequestDTO)
export interface LoginRequest {
  username: string;
  password: string;
}

// Lo que se envía al registrarse (RegisterRequestDTO)
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// Lo que devuelve el backend tras login/register (AuthResponseDTO)
export interface AuthResponse {
  token: string;
  username: string;
}
