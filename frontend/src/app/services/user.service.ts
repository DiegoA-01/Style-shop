import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/enviroments.development';
import { CreateUserRequest, UserAccount } from '../models/user.model';
import { GlobalResponse } from '../models/global-response.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  // GET /users — solo SUPER_ADMIN (ver SecurityConfig del backend)
  getUsers(): Observable<GlobalResponse<UserAccount[]>> {
    return this.http.get<GlobalResponse<UserAccount[]>>(this.baseUrl).pipe(
      catchError(this.handleError)
    );
  }

  // POST /users — crear una cuenta (trabajador o admin)
  createUser(request: CreateUserRequest): Observable<GlobalResponse<UserAccount>> {
    return this.http.post<GlobalResponse<UserAccount>>(this.baseUrl, request).pipe(
      catchError(this.handleError)
    );
  }

  // DELETE /users/:id
  deleteUser(id: number): Observable<GlobalResponse<null>> {
    return this.http.delete<GlobalResponse<null>>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    const mensaje = error.error?.message || 'Ocurrió un error inesperado';
    return throwError(() => new Error(mensaje));
  }
}
