import { Component, inject, input, numberAttribute, output, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './category-form.css',
  templateUrl: './category-form.html',
})
export class CategoryForm implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  id = input<number, string>(undefined as any, { transform: numberAttribute });
  embedded = input(false);
  saved = output<void>();
  closed = output<void>();

  error = signal<string | null>(null);
  guardando = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: ['']
  });

  ngOnInit(): void {
    if (this.id()) {
      this.categoryService.getCategory(this.id()).subscribe({
        next: (response) => {
          this.form.patchValue({
            name: response.data.name,
            description: response.data.description
          });
        },
        error: (err) => this.error.set(err.message)
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      return;
    }

    const datos = {
      name: this.form.value.name!,
      description: this.form.value.description ?? undefined
    };

    const esEdicion = !!this.id();
    const peticion$ = esEdicion
      ? this.categoryService.updateCategory(this.id(), datos)
      : this.categoryService.createCategory(datos);

    this.guardando.set(true);

    peticion$.subscribe({
      next: () => {
        this.toastService.success(esEdicion ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente');
        this.guardando.set(false);
        this.embedded() ? this.saved.emit() : this.router.navigate(['/categories']);
      },
      error: (err) => {
        this.error.set(err.message);
        this.guardando.set(false);
      }
    });
  }

  cerrar(): void {
    this.closed.emit();
  }
}