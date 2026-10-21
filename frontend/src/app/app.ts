import { Component, ElementRef, NgZone, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from './services/auth.service';
import { LoadingService } from './shared/loading.service';
import { ToastContainer } from './shared/toast-container';
import { CartDrawer } from './shared/cart-drawer';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-root',
  // RouterOutlet — necesario para que <router-outlet /> funcione en el HTML
  // (el "hueco" donde el router dibuja la pantalla activa).
  // RouterLink — para que los <a routerLink="/products"> funcionen sin recargar la página.
  // RouterLinkActive — para resaltar visualmente el enlace de la sección donde estás parado.
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainer, CartDrawer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Catalogo de Ropa');
  protected authService = inject(AuthService);
  protected loadingService = inject(LoadingService);
  protected cartService = inject(CartService);
  private router = inject(Router);

  // El home tiene su propio look (nav minimalista, sin padding en <main>).
  protected isHome = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects.split(/[?#]/)[0] === '/'),
    ),
    { initialValue: false },
  );

  private navLinks = viewChild<ElementRef<HTMLElement>>('navLinks');
  private zone = inject(NgZone);

  constructor() {
    afterNextRender(() => this.zone.runOutsideAngular(() => this.efectosGlobales()));
    // Tras cada navegación la gota vuelve al enlace activo.
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => requestAnimationFrame(() => this.moverGota()));
  }

  cerrarSesion(): void {
    this.authService.logout();
  }

  // Lleva la gota de vidrio al enlace con el cursor, o al activo si no hay ninguno.
  moverGota(event?: Event): void {
    const nav = this.navLinks()?.nativeElement;
    const blob = nav?.querySelector<HTMLElement>('.nav-blob');
    if (!nav || !blob) return;
    const link = (event?.currentTarget as HTMLElement | null) ?? nav.querySelector<HTMLElement>('a.activo');
    if (!link) {
      blob.style.setProperty('--bo', '0');
      return;
    }
    blob.style.setProperty('--bx', link.offsetLeft + 'px');
    blob.style.setProperty('--bw', link.offsetWidth + 'px');
    blob.style.setProperty('--bo', '1');
  }

  // Efectos de todo el vidrio: el brillo sigue al cursor (--mx/--my) y los
  // botones hacen una onda en el punto del clic. Un solo listener para la app.
  private efectosGlobales(): void {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    document.addEventListener('pointermove', e => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('.glass, .btn, .btn-line');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
    }, { passive: true });
    document.addEventListener('pointerdown', e => {
      const b = (e.target as Element | null)?.closest<HTMLElement>('.btn, .btn-line');
      if (!b || reduced.matches || (b as HTMLButtonElement).disabled) return;
      const r = b.getBoundingClientRect();
      const s = document.createElement('span');
      s.className = 'ripple';
      s.style.left = e.clientX - r.left + 'px';
      s.style.top = e.clientY - r.top + 'px';
      b.appendChild(s);
      setTimeout(() => s.remove(), 750);
    });
    addEventListener('resize', () => this.moverGota());
    document.fonts?.ready.then(() => this.moverGota());
    this.moverGota();
  }
}
