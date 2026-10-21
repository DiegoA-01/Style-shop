import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SilkRibbon } from '../../shared/silk-ribbon';
import { MagnetDirective } from '../../shared/magnet.directive';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, SilkRibbon, MagnetDirective],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cartService = inject(CartService);

  error = signal<string | null>(null);
  cargando = signal(false);
  verPass = signal(false);

  form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  ingresar(): void {
    if (this.form.invalid) {
      return;
    }

    this.error.set(null);
    this.cargando.set(true);

    this.authService
      .login({
        username: this.form.value.username!,
        password: this.form.value.password!,
      })
      .subscribe({
        next: () => this.continuar(),
        error: (err) => {
          this.error.set(err.message);
          this.cargando.set(false);
        },
      });
  }

  // Si la persona venía armando una compra, vuelve al catálogo con el
  // carrito abierto para que confirme el pedido sin buscarlo de nuevo.
  private continuar(): void {
    // El super admin entra a su panel de ventas, no a la tienda.
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin']);
      return;
    }
    this.router.navigate(['/products']).then(() => {
      if (this.cartService.itemCount() > 0) this.cartService.abrir();
    });
  }
}
