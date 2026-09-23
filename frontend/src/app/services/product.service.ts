import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/enviroments.development';
import { Product, ProductRequest } from '../models/product.model';
import { GlobalResponse } from '../models/global-response.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/product`;

  // GET /product — obtener todos los productos
  getProducts(): Observable<GlobalResponse<Product[]>> {
    return this.http.get<GlobalResponse<Product[]>>(this.baseUrl).pipe(
      catchError(this.handleError)
    );
  }

  // GET /product/:id — obtener un producto
  getProduct(id: number): Observable<GlobalResponse<Product>> {
    return this.http.get<GlobalResponse<Product>>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // POST /product — crear un producto
  createProduct(request: ProductRequest): Observable<GlobalResponse<Product>> {
    return this.http.post<GlobalResponse<Product>>(this.baseUrl, request).pipe(
      catchError(this.handleError)
    );
  }

  // PUT /product/:id — actualizar un producto
  updateProduct(id: number, request: ProductRequest): Observable<GlobalResponse<Product>> {
    return this.http.put<GlobalResponse<Product>>(`${this.baseUrl}/${id}`, request).pipe(
      catchError(this.handleError)
    );
  }

  // DELETE /product/:id — eliminar un producto
  deleteProduct(id: number): Observable<GlobalResponse<null>> {
    return this.http.delete<GlobalResponse<null>>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Manejo básico de errores: extrae el mensaje que ya viene del GlobalExceptionHandler
  private handleError(error: any) {
    const mensaje = error.error?.message || 'Ocurrió un error inesperado';
    return throwError(() => new Error(mensaje));
  }

  uploadImage(file: File): Observable<GlobalResponse<string>> {
    // FormData permite enviar el archivo como multipart/form-data al endpoint de imágenes.
    const formData = new FormData();
    formData.append('file', file);

    // La respuesta contiene la URL que se guarda luego dentro del producto.
    return this.http.post<GlobalResponse<string>>(
      `${this.baseUrl}/upload-image`,
      formData
    ).pipe(
      catchError(this.handleError)
    );
  }
}