import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from '../models/cart.model';
import { Product } from '../models/product.model';

const STORAGE_KEY = 'cart_items';

// Carrito 100% del lado del cliente (persistido en localStorage): no hay
// backend de "carritos", solo se arma el pedido final al confirmar (ver
// OrderService). Así un visitante sin cuenta puede comprar igual.
@Injectable({ providedIn: 'root' })
export class CartService {
  items = signal<CartItem[]>(leerDeStorage());
  isOpen = signal(false);

  itemCount = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  total = computed(() => this.items().reduce((sum, item) => sum + item.product.price * item.quantity, 0));

  // `abrir` en false deja el carrito cerrado (p. ej. mientras la foto vuela a la bolsa).
  agregar(product: Product, quantity = 1, abrir = true): void {
    this.items.update(lista => {
      const existente = lista.find(i => i.product.id === product.id);
      const actualizado = existente
        ? lista.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i)
        : [...lista, { product, quantity }];
      guardarEnStorage(actualizado);
      return actualizado;
    });
    if (abrir) this.isOpen.set(true);
  }

  actualizarCantidad(productId: number, quantity: number): void {
    if (quantity < 1) {
      this.eliminar(productId);
      return;
    }

    this.items.update(lista => {
      const actualizado = lista.map(i => i.product.id === productId ? { ...i, quantity } : i);
      guardarEnStorage(actualizado);
      return actualizado;
    });
  }

  eliminar(productId: number): void {
    this.items.update(lista => {
      const actualizado = lista.filter(i => i.product.id !== productId);
      guardarEnStorage(actualizado);
      return actualizado;
    });
  }

  vaciar(): void {
    this.items.set([]);
    guardarEnStorage([]);
  }

  abrir(): void {
    this.isOpen.set(true);
  }

  cerrar(): void {
    this.isOpen.set(false);
  }
}

function guardarEnStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota excedida, etc.):
    // el carrito sigue funcionando en memoria durante la sesión.
  }
}

function leerDeStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
