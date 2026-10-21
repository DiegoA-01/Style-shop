import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewEncapsulation,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { CopCurrencyPipe } from '../../shared/cop-currency.pipe';
import { Product } from '../../models/product.model';
import { getCategoryImage } from '../../utils/category-image.util';
import { clamp } from '../../shared/silk';
import { RevealDirective } from '../../shared/reveal.directive';
import { TiltDirective } from '../../shared/tilt.directive';
import { flyToBag } from '../../utils/fly-to-bag.util';
import { ShirtOrbit } from '../../shared/shirt-orbit';
import { Carousel3d } from '../../shared/carousel3d';
import { MagnetDirective } from '../../shared/magnet.directive';

// Landing: portada con el anillo 3D de camisas de la temporada, la historia
// de la casa con un monograma que se "cose", la vitrina de productos reales en
// coverflow 3D y la tienda física.
@Component({
  selector: 'app-home',
  imports: [RouterLink, CopCurrencyPipe, RevealDirective, TiltDirective, ShirtOrbit, Carousel3d, MagnetDirective],
  styleUrl: './home.css',
  templateUrl: './home.html',
  // Sin encapsulación: las tarjetas proyectadas en el carrusel 3D no llevan el
  // atributo de Angular. Todo el CSS vive bajo `.lux`.
  encapsulation: ViewEncapsulation.None,
})
export class Home implements OnDestroy {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private productService = inject(ProductService);
  private cartService = inject(CartService);

  products = signal<Product[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  cosido = signal(false);
  agregado = signal<number | null>(null);

  protected getCategoryImage = getCategoryImage;

  private cleanups: Array<() => void> = [];

  constructor() {
    this.productService.getProducts().subscribe({
      next: res => {
        this.products.set(res.data.slice(0, 6));
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar la colección. Intenta de nuevo en un momento.');
        this.cargando.set(false);
      },
    });

    afterNextRender(() => this.zone.runOutsideAngular(() => this.init()));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach(fn => fn());
  }

  // La foto vuela a la bolsa del nav y, al llegar, se abre el carrito.
  agregar(product: Product, event?: Event): void {
    const frame = (event?.currentTarget as HTMLElement | null)?.closest('.p3d')?.querySelector('figure');
    this.cartService.agregar(product, 1, false);
    this.agregado.set(product.id);
    flyToBag(frame).then(() => this.cartService.abrir());
    setTimeout(() => {
      if (this.agregado() === product.id) this.agregado.set(null);
    }, 1800);
  }

  onImageError(event: Event, categoryName: string): void {
    const img = event.target as HTMLImageElement;
    const fallback = getCategoryImage(categoryName);
    if (!img.src.endsWith(fallback)) img.src = fallback;
  }

  // ─────────────────────────── init ───────────────────────────

  private init(): void {
    const root = this.host.nativeElement.querySelector<HTMLElement>('.lux')!;
    this.initHold(root);

    const onVis = () => root.classList.toggle('paused', document.hidden);
    document.addEventListener('visibilitychange', onVis);
    this.cleanups.push(() => document.removeEventListener('visibilitychange', onVis));
  }

  // ─────────────────── momento interactivo: coser ───────────────────

  private initHold(root: HTMLElement): void {
    const btn = root.querySelector<HTMLButtonElement>('.hold')!;
    const mono = root.querySelector<HTMLElement>('.maison-mark')!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');

    let progress = 0, holding = false, rafId: number | null = null, last = 0, done = false;
    const HOLD_MS = 1600, RELEASE_MS = 900;

    const finish = () => {
      done = true;
      progress = 1;
      mono.style.setProperty('--stitch', '1');
      this.zone.run(() => this.cosido.set(true));
    };
    const step = (now: number) => {
      const dt = Math.min(100, now - (last || now));
      last = now;
      progress = clamp(progress + (holding ? dt / HOLD_MS : -dt / RELEASE_MS), 0, 1);
      mono.style.setProperty('--stitch', progress.toFixed(3));
      if (progress >= 1) { finish(); rafId = null; last = 0; return; }
      if (!holding && progress <= 0) { rafId = null; last = 0; return; }
      rafId = requestAnimationFrame(step);
    };
    const start = (e: Event) => {
      if (done) return;
      e.preventDefault();
      if (reduced.matches) { finish(); return; }
      holding = true;
      if (rafId === null) rafId = requestAnimationFrame(step);
    };
    const stop = () => {
      holding = false;
      if (!done && rafId === null && progress > 0) rafId = requestAnimationFrame(step);
    };
    const keyDown = (e: KeyboardEvent) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); };
    const keyUp = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') stop(); };

    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointerleave', stop);
    btn.addEventListener('pointercancel', stop);
    btn.addEventListener('keydown', keyDown);
    btn.addEventListener('keyup', keyUp);
    btn.addEventListener('contextmenu', e => e.preventDefault());
    const onReduced = () => { if (reduced.matches && !done) finish(); };
    reduced.addEventListener('change', onReduced);
    onReduced();

    this.cleanups.push(() => {
      reduced.removeEventListener('change', onReduced);
      if (rafId !== null) cancelAnimationFrame(rafId);
    });
  }
}
