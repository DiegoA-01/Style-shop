import { Component, HostListener, inject, signal, OnInit } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';
import { getCategoryImage } from '../../utils/category-image.util';
import { Router, RouterLink } from '@angular/router';
import { CategoryForm } from '../category-form/category-form';
import { ToastService } from '../../shared/toast.service';

@Component({
  imports: [RouterLink, CategoryForm],
  styleUrl: './category-list.css',
  templateUrl: './category-list.html',
})
export class CategoryList implements OnInit {
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  categories = signal<Category[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  categoriaAEliminar = signal<number | null>(null);
  mostrarFormulario = signal(false);

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response.data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.cargando.set(false);
      }
    });
  }

  abrirFormulario(): void {
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
  }

  categoriaGuardada(): void {
    this.mostrarFormulario.set(false);
    this.cargarCategorias();
  }

  eliminar(id: number): void {
    this.categoriaAEliminar.set(id);
  }

  confirmarEliminacion(): void {
    const id = this.categoriaAEliminar();

    if (id === null) {
      return;
    }

    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.categories.update(lista => lista.filter(c => c.id !== id));
        this.categoriaAEliminar.set(null);
        this.toastService.success('Categoría eliminada correctamente');
      },
      error: (err) => {
        this.toastService.error(err.message);
        this.categoriaAEliminar.set(null);
      }
    });
  }

  cancelarEliminacion(): void {
    this.categoriaAEliminar.set(null);
  }

  // Al hacer click en una categoría se navega al catálogo de productos ya
  // filtrado por esa categoría (categoryName solo es para el título, evita
  // pedirle la categoría de nuevo al backend en product-list).
  verProductos(category: Category): void {
    this.router.navigate(['/products'], {
      queryParams: { categoryId: category.id, categoryName: category.name }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.categoriaAEliminar() !== null) {
      this.cancelarEliminacion();
    } else if (this.mostrarFormulario()) {
      this.cerrarFormulario();
    }
  }

  getCategoryImage(categoryName: string): string {
    return getCategoryImage(categoryName);
  }

  // Si falta la foto asociada a la categoría, se muestra una imagen general.
  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.onerror = null;
    image.src = '/images/hero-bg2.jpg';
  }
}