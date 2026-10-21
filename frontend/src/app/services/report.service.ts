import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/enviroments.development';
import { GlobalResponse } from '../models/global-response.model';
import { DailyReport, MonthlyReport, ProductRanking, YearReport } from '../models/report.model';

// Estadísticas de venta (/reports): solo SUPER_ADMIN.
@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reports`;

  // date en formato YYYY-MM-DD; sin fecha, el backend usa hoy.
  getDaily(date?: string): Observable<GlobalResponse<DailyReport>> {
    const params = date ? new HttpParams().set('date', date) : undefined;
    return this.http.get<GlobalResponse<DailyReport>>(`${this.baseUrl}/daily`, { params }).pipe(catchError(this.handleError));
  }

  getMonthly(year: number): Observable<GlobalResponse<MonthlyReport>> {
    const params = new HttpParams().set('year', year);
    return this.http.get<GlobalResponse<MonthlyReport>>(`${this.baseUrl}/monthly`, { params }).pipe(catchError(this.handleError));
  }

  getYearly(): Observable<GlobalResponse<YearReport[]>> {
    return this.http.get<GlobalResponse<YearReport[]>>(`${this.baseUrl}/yearly`).pipe(catchError(this.handleError));
  }

  getProducts(year: number): Observable<GlobalResponse<ProductRanking>> {
    const params = new HttpParams().set('year', year);
    return this.http.get<GlobalResponse<ProductRanking>>(`${this.baseUrl}/products`, { params }).pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    const mensaje = error.error?.message || 'Ocurrió un error inesperado';
    return throwError(() => new Error(mensaje));
  }
}
