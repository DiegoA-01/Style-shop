import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/enviroments.development';
import { CounterSaleRequest, Order, OrderRequest, OrderStatus, PayOrderRequest } from '../models/order.model';
import { GlobalResponse } from '../models/global-response.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  // POST /orders — público: el pedido web nace PENDIENTE hasta que el cajero lo cobre.
  createOrder(request: OrderRequest): Observable<GlobalResponse<Order>> {
    return this.http.post<GlobalResponse<Order>>(this.baseUrl, request).pipe(
      catchError(this.handleError)
    );
  }

  // GET /orders[?status=] — historial o cola filtrada; CAJERO o SUPER_ADMIN.
  getOrders(status?: OrderStatus): Observable<GlobalResponse<Order[]>> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<GlobalResponse<Order[]>>(this.baseUrl, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // POST /orders/:id/pay — cobra y despacha un pedido pendiente (descuenta stock).
  payOrder(id: number, request: PayOrderRequest): Observable<GlobalResponse<Order>> {
    return this.http.post<GlobalResponse<Order>>(`${this.baseUrl}/${id}/pay`, request).pipe(
      catchError(this.handleError)
    );
  }

  // POST /orders/:id/cancel — anula un pedido pendiente.
  cancelOrder(id: number): Observable<GlobalResponse<Order>> {
    return this.http.post<GlobalResponse<Order>>(`${this.baseUrl}/${id}/cancel`, {}).pipe(
      catchError(this.handleError)
    );
  }

  // POST /orders/counter — venta de mostrador, se crea ya cobrada.
  createCounterSale(request: CounterSaleRequest): Observable<GlobalResponse<Order>> {
    return this.http.post<GlobalResponse<Order>>(`${this.baseUrl}/counter`, request).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    const mensaje = error.error?.message || 'Ocurrió un error inesperado';
    return throwError(() => new Error(mensaje));
  }
}
