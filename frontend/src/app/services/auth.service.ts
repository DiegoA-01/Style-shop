import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/enviroments.development';
import { GlobalResponse } from '../models/global-response.model';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

const TOKEN_KEY = 'auth_token';
const USERNAME_KEY = 'auth_username';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  // Se inicializa leyendo localStorage para que la sesión sobreviva a un refresh de página.
  currentUser = signal<string | null>(localStorage.getItem(USERNAME_KEY));

  // POST /auth/login
  login(request: LoginRequest): Observable<GlobalResponse<AuthResponse>> {
    return this.http.post<GlobalResponse<AuthResponse>>(`${this.baseUrl}/login`, request).pipe(
      tap((response) => this.guardarSesion(response.data)),
      catchError(this.handleError)
    );
  }

  // POST /auth/register
  register(request: RegisterRequest): Observable<GlobalResponse<AuthResponse>> {
    return this.http.post<GlobalResponse<AuthResponse>>(`${this.baseUrl}/register`, request).pipe(
      tap((response) => this.guardarSesion(response.data)),
      catchError(this.handleError)
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    this.currentUser.set(null);
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
    this.currentUser.set(data.username);
  }

  private handleError(error: any) {
    const mensaje = error.error?.message || 'Ocurrió un error inesperado';
    return throwError(() => new Error(mensaje));
  }
}
