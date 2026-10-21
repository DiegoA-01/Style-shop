import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from './toast.service';
import { CopCurrencyPipe } from './cop-currency.pipe';
import { buildWhatsappOrderUrl } from '../utils/whatsapp-order.util';
import { getCategoryImage } from '../utils/category-image.util';
import { passwordsIguales } from '../utils/passwords-iguales.validator';

@Component({
  selector: 'app-cart-drawer',
  imports: [ReactiveFormsModule, CopCurrencyPipe],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.css',
})
export class CartDrawer {
  protected cartService = inject(CartService);
  private orderService = inject(OrderService);
  protected authService = inject(AuthService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  confirmando = signal(false);
  mostrarFormulario = signal(false);
  // Comprar exige sesión: si no hay una, este paso intermedio pide login
  // antes de dejar pasar al formulario de datos del pedido.
  mostrarLogin = signal(false);
  // Quien no tiene cuenta la crea aquí mismo, sin salir del carrito.
  mostrarRegistro = signal(false);
  registrando = signal(false);
  registroError = signal<string | null>(null);
  ingresando = signal(false);
  loginError = signal<string | null>(null);

  form = this.fb.group({
    customerName: ['', [Validators.required, Validators.minLength(3)]],
    customerPhone: ['', [Validators.required, Validators.minLength(7)]],
  });

  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  registerForm = this.fb.group(
    {
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsIguales }
  );

  cerrar(): void {
    this.cartService.cerrar();
    this.mostrarFormulario.set(false);
    this.mostrarLogin.set(false);
    this.mostrarRegistro.set(false);
  }

  irAConfirmar(): void {
    if (!this.authService.isLoggedIn()) {
      this.mostrarLogin.set(true);
      return;
    }

    this.mostrarFormulario.set(true);
  }

  volverAlCarrito(): void {
    this.mostrarFormulario.set(false);
    this.mostrarLogin.set(false);
    this.mostrarRegistro.set(false);
  }

  irARegistro(): void {
    this.loginError.set(null);
    this.mostrarLogin.set(false);
    this.mostrarRegistro.set(true);
  }

  irALogin(): void {
    this.registroError.set(null);
    this.mostrarRegistro.set(false);
    this.mostrarLogin.set(true);
  }

  registrar(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.registroError.set(null);
    this.registrando.set(true);

    this.authService
      .register({
        username: this.registerForm.value.username!,
        email: this.registerForm.value.email!,
        password: this.registerForm.value.password!,
      })
      .subscribe({
        next: () => {
          this.registrando.set(false);
          this.registerForm.reset();
          // El registro ya deja la sesión iniciada: sigue directo al pedido.
          this.mostrarRegistro.set(false);
          this.mostrarFormulario.set(true);
          this.toastService.success('Cuenta creada. Ya puedes terminar tu compra.');
        },
        error: (err) => {
          this.registroError.set(err.message);
          this.registrando.set(false);
        },
      });
  }

  ingresar(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loginError.set(null);
    this.ingresando.set(true);

    this.authService
      .login({
        username: this.loginForm.value.username!,
        password: this.loginForm.value.password!,
      })
      .subscribe({
        next: () => {
          this.ingresando.set(false);
          this.loginForm.reset();
          // Ya con sesión, pasa directo al formulario del pedido en vez de
          // devolverlo al carrito para que confirme por segunda vez.
          this.mostrarLogin.set(false);
          this.mostrarFormulario.set(true);
        },
        error: (err) => {
          this.loginError.set(err.message);
          this.ingresando.set(false);
        },
      });
  }

  getImagenProducto(item: { product: { imageUrl?: string; category: { name: string } } }): string {
    return item.product.imageUrl || getCategoryImage(item.product.category.name);
  }

  confirmarPedido(): void {
    if (this.form.invalid) {
      return;
    }

    this.confirmando.set(true);

    const items = this.cartService.items().map(i => ({ productId: i.product.id, quantity: i.quantity }));

    this.orderService
      .createOrder({
        customerName: this.form.value.customerName!,
        customerPhone: this.form.value.customerPhone!,
        items,
      })
      .subscribe({
        next: (response) => {
          const url = buildWhatsappOrderUrl(response.data);
          window.open(url, '_blank');
          this.toastService.success('Pedido registrado. Confírmalo por WhatsApp para coordinar el pago y la entrega.');
          this.cartService.vaciar();
          this.form.reset();
          this.confirmando.set(false);
          this.cerrar();
        },
        error: (err) => {
          this.toastService.error(err.message);
          this.confirmando.set(false);
        },
      });
  }
}
