export interface OrderItemRequest {
  productId: number;
  quantity: number;
}

export interface OrderRequest {
  customerName: string;
  customerPhone: string;
  items: OrderItemRequest[];
}

export interface OrderItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export type OrderStatus = 'PENDIENTE' | 'PAGADA' | 'ANULADA';
export type SaleChannel = 'WEB' | 'MOSTRADOR';
export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';

// Lo que devuelve el backend (OrderResponseDTO)
export interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  status: OrderStatus;
  channel: SaleChannel;
  paymentMethod: PaymentMethod | null;
  amountReceived: number | null;
  changeGiven: number | null;
  paidAt: string | null;
  cashierUsername: string | null;
  cancelledAt: string | null;
}

// Cobro de un pedido pendiente (PayOrderRequestDTO). amountReceived solo en efectivo.
export interface PayOrderRequest {
  paymentMethod: PaymentMethod;
  amountReceived?: number;
}

// Venta de mostrador (CounterSaleRequestDTO).
export interface CounterSaleRequest {
  customerName?: string;
  customerPhone?: string;
  items: OrderItemRequest[];
  paymentMethod: PaymentMethod;
  amountReceived?: number;
}
