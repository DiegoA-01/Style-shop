import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/enviroments.development';
import { Category, CategoryRequest } from '../models/category.model';
import { GlobalResponse } from '../models/global-response.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/category`;

  // GET /category — obtener todas las categorías
  getCategories(): Observable<GlobalResponse<Category[]>> {
    return this.http.get<GlobalResponse<Category[]>>(this.baseUrl).pipe(
      catchError(this.handleError)
    );
  }

  // GET /category/:id — obtener una categoría
  getCategory(id: number): Observable<GlobalResponse<Category>> {
    return this.http.get<GlobalResponse<Category>>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // POST /category — crear una categoría
  createCategory(request: CategoryRequest): Observable<GlobalResponse<Category>> {
    return this.http.post<GlobalResponse<Category>>(this.baseUrl, request).pipe(
      catchError(this.handleError)
    );
  }

  // PUT /category/:id — actualizar una categoría
  updateCategory(id: number, request: CategoryRequest): Observable<GlobalResponse<Category>> {
    return this.http.put<GlobalResponse<Category>>(`${this.baseUrl}/${id}`, request).pipe(
      catchError(this.handleError)
    );
  }

  // DELETE /category/:id — eliminar una categoría
  deleteCategory(id: number): Observable<GlobalResponse<null>> {
    return this.http.delete<GlobalResponse<null>>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Manejo básico de errores: extrae el mensaje que ya viene del GlobalExceptionHandler
  private handleError(error: any) {
    const mensaje = error.error?.message || 'Ocurrió un error inesperado';
    return throwError(() => new Error(mensaje));
  }
}