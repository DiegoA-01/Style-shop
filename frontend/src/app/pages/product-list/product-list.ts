import { Component, HostListener, inject, input, numberAttribute, computed, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { getCategoryImage } from '../../utils/category-image.util';
import { ProductForm } from '../product-form/product-form';
import { ToastService } from '../../shared/toast.service';
import { CopCurrencyPipe } from '../../shared/cop-currency.pipe';

@Component({
  imports: [RouterLink, ProductForm, CopCurrencyPipe],
  styleUrl: './product-list.css',
  templateUrl: './product-list.html',
})
export class ProductList implements OnInit {
  private productService = inject(ProductService);
  private toastService = inject(ToastService);

  // Query params que llegan al navegar desde una categoría (ver CategoryList.verProductos).
  categoryId = input<number, string>(undefined as any, { transform: numberAttribute });
  categoryName = input<string>();

  products = signal<Product[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  productoAEliminar = signal<number | null>(null);
  mostrarFormulario = signal(false);

  // Si hay un categoryId en la URL, solo se muestran los productos de esa categoría.
  productosFiltrados = computed(() => {
    const id = this.categoryId();
    const lista = this.products();
    return id ? lista.filter(p => p.category.id === id) : lista;
  });

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.productService.getProducts().subscribe({
      next: (response) => {
        this.products.set(response.data);
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

  productoGuardado(): void {
    this.mostrarFormulario.set(false);
    this.cargarProductos();
  }

  eliminar(id: number): void {
    this.productoAEliminar.set(id);
  }

  confirmarEliminacion(): void {
    const id = this.productoAEliminar();

    if (id === null) {
      return;
    }

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products.update(lista => lista.filter(p => p.id !== id));
        this.productoAEliminar.set(null);
        this.toastService.success('Producto eliminado correctamente');
      },
      error: (err) => {
        this.toastService.error(err.message);
        this.productoAEliminar.set(null);
      }
    });
  }

  cancelarEliminacion(): void {
    this.productoAEliminar.set(null);
  }

  // Escape cierra lo que esté abierto (modal de formulario o de confirmación),
  // dándole al usuario una salida rápida sin tener que buscar el botón (heurística: control y libertad).
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.productoAEliminar() !== null) {
      this.cancelarEliminacion();
    } else if (this.mostrarFormulario()) {
      this.cerrarFormulario();
    }
  }

  // Devuelve la ruta de la imagen genérica según el nombre de la categoría
  getCategoryImage(categoryName: string): string {
    return getCategoryImage(categoryName);
  }

  // Si la imagen de categoría no existe (archivo no encontrado), cae al placeholder
  onImageError(event: Event, categoryName: string): void {
    const image = event.target as HTMLImageElement;
    image.onerror = null;
    image.src = getCategoryImage(categoryName);
  }
}