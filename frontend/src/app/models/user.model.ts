import { Role } from './auth.model';

// Representa una cuenta tal como la devuelve el backend (UserResponseDTO)
export interface UserAccount {
  id: number;
  username: string;
  email: string;
  role: Role;
}

// Lo que se envía al crear una cuenta (CreateUserRequestDTO)
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: Role;
}
