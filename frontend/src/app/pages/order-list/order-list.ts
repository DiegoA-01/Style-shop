import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { CopCurrencyPipe } from '../../shared/cop-currency.pipe';

@Component({
  imports: [CopCurrencyPipe, DatePipe],
  styleUrl: './order-list.css',
  templateUrl: './order-list.html',
})
export class OrderList implements OnInit {
  private orderService = inject(OrderService);

  orders = signal<Order[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  pedidoExpandido = signal<number | null>(null);

  ngOnInit(): void {
    this.orderService.getOrders().subscribe({
      next: (response) => {
        this.orders.set(response.data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.cargando.set(false);
      },
    });
  }

  alternarDetalle(orderId: number): void {
    this.pedidoExpandido.set(this.pedidoExpandido() === orderId ? null : orderId);
  }
}
