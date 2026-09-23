import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

function passwordsIguales(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsDistintas: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  error = signal<string | null>(null);
  cargando = signal(false);

  form = this.fb.group(
    {
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsIguales }
  );

  registrar(): void {
    if (this.form.invalid) {
      return;
    }

    this.error.set(null);
    this.cargando.set(true);

    this.authService
      .register({
        username: this.form.value.username!,
        email: this.form.value.email!,
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
