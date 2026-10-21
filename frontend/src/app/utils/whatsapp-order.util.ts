import { Order } from '../models/order.model';
import { environment } from '../../environments/enviroments.development';

// Arma el link de "click-to-chat" de WhatsApp (wa.me) con el pedido ya
// redactado, sin necesidad de la API de WhatsApp Business: el cliente
// simplemente envía ese mensaje al negocio para coordinar pago y entrega.
export function buildWhatsappOrderUrl(order: Order): string {
  const lineas = order.items.map(
    item => `• ${item.quantity}x ${item.productName} — ${formatCop(item.subtotal)}`
  );

  const mensaje = [
    '🛍️ *Nuevo pedido - Style Shop*',
    '',
    `Cliente: ${order.customerName}`,
    `Teléfono: ${order.customerPhone}`,
    '',
    ...lineas,
    '',
    `*Total: ${formatCop(order.total)}*`,
    '',
    `Pedido #${order.id}`,
  ].join('\n');

  return `https://wa.me/${environment.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
}

// Mismo formato que copCurrency (shared/cop-currency.pipe.ts), para que el
// total en el mensaje de WhatsApp coincida con lo que el cliente vio en el carrito.
function formatCop(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(valor);
}
