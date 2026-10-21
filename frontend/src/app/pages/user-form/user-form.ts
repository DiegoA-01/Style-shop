import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../shared/toast.service';

// A diferencia de category-form/product-form, esta solo crea cuentas:
// el backend no expone un PUT /users, así que no hay modo edición.
@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule],
  styleUrl: './user-form.css',
  templateUrl: './user-form.html',
})
export class UserForm {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  saved = output<void>();
  closed = output<void>();

  // Roles de personal que puede crear el super admin. Los clientes (USUARIO)
  // no se crean aquí: se registran solos desde la tienda.
  readonly roles = [
    { value: 'TRABAJADOR', label: 'Empleado', desc: 'Crea y edita productos y categorías, y sube las fotos.' },
    { value: 'CAJERO', label: 'Cajero', desc: 'Cobra y despacha los pedidos, y registra ventas de mostrador.' },
    { value: 'SUPER_ADMIN', label: 'Super admin', desc: 'Puede todo: ventas, estadísticas, catálogo y equipo.' },
  ];

  error = signal<string | null>(null);
  guardando = signal(false);

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['TRABAJADOR', [Validators.required]],
  });

  guardar(): void {
    if (this.form.invalid) {
      return;
    }

    this.error.set(null);
    this.guardando.set(true);

    this.userService
      .createUser({
        username: this.form.value.username!,
        email: this.form.value.email!,
        password: this.form.value.password!,
        role: this.form.value.role as 'SUPER_ADMIN' | 'TRABAJADOR' | 'CAJERO',
      })
      .subscribe({
        next: () => {
          this.toastService.success('Cuenta creada');
          this.guardando.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.error.set(err.message);
          this.guardando.set(false);
        },
      });
  }

  cerrar(): void {
    this.closed.emit();
  }
}
