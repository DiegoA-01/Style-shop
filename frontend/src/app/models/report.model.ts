import { Order } from './order.model';

// Respuestas de /reports (ReportDTO en el backend). Solo cuentan ventas PAGADA.

export interface SaleLine {
  orderId: number;
  paidAt: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  channel: 'WEB' | 'MOSTRADOR';
  paymentMethod: string | null;
  cashierUsername: string | null;
}

export interface DailyReport {
  date: string;
  total: number;
  salesCount: number;
  unitsSold: number;
  averageTicket: number;
  monthTotal: number;
  yearTotal: number;
  lines: SaleLine[];
  orders: Order[];
}

// share: porcentaje del total del año; growth: variación vs el mes anterior (null si era 0).
export interface MonthReport {
  month: number;
  total: number;
  salesCount: number;
  share: number;
  growth: number | null;
}

export interface MonthlyReport {
  year: number;
  yearTotal: number;
  salesCount: number;
  months: MonthReport[];
}

export interface YearReport {
  year: number;
  total: number;
  salesCount: number;
  growth: number | null;
}

export interface ProductSales {
  productId: number | null;
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface ProductRanking {
  year: number;
  best: ProductSales | null;
  worst: ProductSales | null;
  products: ProductSales[];
}
