import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/enviroments.development';
import { GlobalResponse } from '../models/global-response.model';
import { AuthResponse, LoginRequest, RegisterRequest, Role } from '../models/auth.model';

const TOKEN_KEY = 'auth_token';
const USERNAME_KEY = 'auth_username';
const ROLE_KEY = 'auth_role';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  // Se inicializan leyendo localStorage para que la sesión sobreviva a un refresh de página.
  currentUser = signal<string | null>(localStorage.getItem(USERNAME_KEY));
  currentRole = signal<Role | null>(localStorage.getItem(ROLE_KEY) as Role | null);

  isAdmin = computed(() => this.currentRole() === 'SUPER_ADMIN');
  // Personal que administra el catálogo (crear/editar/eliminar productos y
  // categorías, subir imágenes). Un USUARIO normal (registro público) no cuenta.
  isStaff = computed(() => this.currentRole() === 'SUPER_ADMIN' || this.currentRole() === 'TRABAJADOR');
  // Personal que maneja ventas: ver pedidos, cobrar, vender en mostrador.
  canSell = computed(() => this.currentRole() === 'SUPER_ADMIN' || this.currentRole() === 'CAJERO');

  // POST /auth/login
  login(request: LoginRequest): Observable<GlobalResponse<AuthResponse>> {
    return this.http.post<GlobalResponse<AuthResponse>>(`${this.baseUrl}/login`, request).pipe(
      tap((response) => this.guardarSesion(response.data)),
      catchError(this.handleError)
    );
  }

  // POST /auth/register — siempre crea una cuenta USUARIO.
  register(request: RegisterRequest): Observable<GlobalResponse<AuthResponse>> {
    return this.http.post<GlobalResponse<AuthResponse>>(`${this.baseUrl}/register`, request).pipe(
      tap((response) => this.guardarSesion(response.data)),
      catchError(this.handleError)
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(ROLE_KEY);
    this.currentUser.set(null);
    this.currentRole.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private guardarSesion(data: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USERNAME_KEY, data.username);
    localStorage.setItem(ROLE_KEY, data.role);
    this.currentUser.set(data.username);
    this.currentRole.set(data.role);
  }

  private handleError(error: any) {
    const mensaje = error.error?.message || 'Ocurrió un error inesperado';
    return throwError(() => new Error(mensaje));
  }
}
