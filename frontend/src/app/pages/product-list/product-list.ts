import { Component, HostListener, inject, input, numberAttribute, computed, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { getCategoryImage } from '../../utils/category-image.util';
import { ProductForm } from '../product-form/product-form';
import { ToastService } from '../../shared/toast.service';
import { CopCurrencyPipe } from '../../shared/cop-currency.pipe';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';
import { RevealDirective } from '../../shared/reveal.directive';
import { TiltDirective } from '../../shared/tilt.directive';
import { Carousel3d } from '../../shared/carousel3d';
import { flyToBag } from '../../utils/fly-to-bag.util';

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, ProductForm, CopCurrencyPipe, RevealDirective, TiltDirective, Carousel3d],
  styleUrl: './product-list.css',
  templateUrl: './product-list.html',
})
export class ProductList implements OnInit {
  private productService = inject(ProductService);
  private toastService = inject(ToastService);
  protected authService = inject(AuthService);
  protected cartService = inject(CartService);
  private categoryService = inject(CategoryService);

  // Query params que llegan al navegar desde una categoría (ver las tarjetas de CategoryList).
  categoryId = input<number, string>(undefined as any, { transform: numberAttribute });
  categoryName = input<string>();

  products = signal<Product[]>([]);
  // Solo alimenta los filtros; si falla, la página sigue funcionando sin ellos.
  categories = signal<Category[]>([]);
  // Id de la pieza recién añadida: su botón muestra "Añadida ✓" un momento.
  agregado = signal<number | null>(null);
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
    this.categoryService.getCategories().subscribe({
      next: (response) => this.categories.set(response.data),
      error: () => this.categories.set([]),
    });
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

  // La foto vuela a la bolsa del nav y, al llegar, se abre el carrito
  // (que ya muestra la pieza, así que no hace falta un aviso aparte).
  agregarAlCarrito(product: Product, event?: Event): void {
    const frame = (event?.currentTarget as HTMLElement | null)?.closest('figure');
    this.cartService.agregar(product, 1, false);
    this.agregado.set(product.id);
    flyToBag(frame).then(() => this.cartService.abrir());
    setTimeout(() => {
      if (this.agregado() === product.id) this.agregado.set(null);
    }, 1800);
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
        this.toastService.success('Pieza eliminada del catálogo');
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