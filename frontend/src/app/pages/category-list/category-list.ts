import { Component, HostListener, inject, signal, OnInit } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';
import { getCategoryImage } from '../../utils/category-image.util';
import { RouterLink } from '@angular/router';
import { CategoryForm } from '../category-form/category-form';
import { ToastService } from '../../shared/toast.service';
import { AuthService } from '../../services/auth.service';
import { RevealDirective } from '../../shared/reveal.directive';
import { TiltDirective } from '../../shared/tilt.directive';
import { Carousel3d } from '../../shared/carousel3d';

@Component({
  imports: [RouterLink, CategoryForm, RevealDirective, TiltDirective, Carousel3d],
  styleUrl: './category-list.css',
  templateUrl: './category-list.html',
})
export class CategoryList implements OnInit {
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);
  protected authService = inject(AuthService);

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
        this.toastService.success('Categoría eliminada');
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

  // Las fotos de producto con fondo blanco van "flotando" en el estudio; las
  // fotos de ambiente (fondo oscuro o de color) llenan la tarjeta. Se decide
  // mirando 8 puntos del borde: si la mayoría son claros, es fondo de estudio.
  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    try {
      const size = 16;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, size, size);
      const m = size - 1, h = Math.floor(size / 2);
      const puntos = [[0, 0], [h, 0], [m, 0], [0, h], [m, h], [0, m], [h, m], [m, m]];
      const claros = puntos.filter(([x, y]) => {
        const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
        return (r + g + b) / 3 > 215;
      }).length;
      img.classList.toggle('photo', claros < puntos.length / 2);
    } catch {
      // Imagen de otro origen sin permiso de lectura: se queda en el estudio.
    }
  }

  // Si falta la foto asociada a la categoría, se muestra una imagen general.
  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.onerror = null;
    image.src = '/images/hero-bg2.jpg';
  }
}