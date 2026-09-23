import { Component, inject, input, numberAttribute, output, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';
import { ToastService } from '../../shared/toast.service';
import { CopCurrencyPipe } from '../../shared/cop-currency.pipe';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink, CopCurrencyPipe],
  styleUrl: './product-form.css',
  templateUrl: './product-form.html',
})
export class ProductForm implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  id = input<number, string>(undefined as any, { transform: numberAttribute });
  embedded = input(false);
  saved = output<void>();
  closed = output<void>();

  categories = signal<Category[]>([]);
  error = signal<string | null>(null);

  // selectedFile conserva el archivo elegido; previewUrl muestra una vista local y
  // imageUrl conserva la ruta devuelta por el backend para guardar el producto.
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  imageUrl = signal<string | null>(null);
  subiendoImagen = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    categoryId: [null as number | null, [Validators.required]]
  });

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => this.categories.set(response.data),
      error: (err) => this.error.set(err.message)
    });

    if (this.id()) {
      this.productService.getProduct(this.id()).subscribe({
        next: (response) => {
          this.form.patchValue({
            name: response.data.name,
            description: response.data.description,
            price: response.data.price,
            stock: response.data.stock,
            categoryId: response.data.category.id
          });
          // Al editar, se reutiliza la imagen guardada para mostrarla en la vista previa.
          if (response.data.imageUrl) {
            this.imageUrl.set(response.data.imageUrl);
            this.previewUrl.set(response.data.imageUrl);
          }
        },
        error: (err) => this.error.set(err.message)
      });
    }
  }

  // Selecciona el archivo, enseña una vista previa local y lo sube al backend.
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.selectedFile.set(file);

    // FileReader permite mostrar la imagen inmediatamente, antes de recibir la respuesta.
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);

    // El backend devuelve la URL definitiva que después se envía al crear o editar.
    this.subiendoImagen.set(true);
    this.productService.uploadImage(file).subscribe({
      next: (response) => {
        this.imageUrl.set(response.data);
        this.subiendoImagen.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.subiendoImagen.set(false);
      }
    });
  }

  guardando = signal(false);

  guardar(): void {
    if (this.form.invalid) {
      return;
    }

    // imageUrl relaciona el producto con la imagen que se subió previamente.
    const datos = {
      name: this.form.value.name!,
      description: this.form.value.description ?? undefined,
      price: this.form.value.price!,
      stock: this.form.value.stock!,
      categoryId: this.form.value.categoryId!,
      imageUrl: this.imageUrl() ?? undefined
    };

    const esEdicion = !!this.id();
    const peticion$ = esEdicion
      ? this.productService.updateProduct(this.id(), datos)
      : this.productService.createProduct(datos);

    this.guardando.set(true);

    peticion$.subscribe({
      next: () => {
        this.toastService.success(esEdicion ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
        this.guardando.set(false);
        this.embedded() ? this.saved.emit() : this.router.navigate(['/products']);
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