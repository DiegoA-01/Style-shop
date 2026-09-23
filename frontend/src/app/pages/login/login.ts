import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  error = signal<string | null>(null);
  cargando = signal(false);

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
        next: () => this.router.navigate(['/products']),
        error: (err) => {
          this.error.set(err.message);
          this.cargando.set(false);
        },
      });
  }
}
