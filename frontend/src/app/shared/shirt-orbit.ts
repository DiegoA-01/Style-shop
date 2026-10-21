import { Component, ElementRef, NgZone, OnDestroy, afterNextRender, inject, signal } from '@angular/core';

export interface OrbitShirt {
  src: string;
  name: string;
  note: string;
  alt: string;
}

// Fotos de temporada (Unsplash, licencia libre) guardadas en public/images/temporada.
export const TEMPORADA: OrbitShirt[] = [
  { src: '/images/temporada/camiseta-blanca.jpg', name: 'Camiseta blanca', note: 'Algodón, cuello redondo', alt: 'Camiseta blanca colgada sobre muro de concreto' },
  { src: '/images/temporada/linea-verde.jpg', name: 'Línea verde', note: 'Colección en perchas de madera', alt: 'Camisetas verdes en perchas de madera' },
  { src: '/images/temporada/gris-jaspeado.jpg', name: 'Gris jaspeado', note: 'Corte suelto, manga corta', alt: 'Camiseta gris jaspeada colgada en pared blanca' },
  { src: '/images/temporada/trio-negro.jpg', name: 'Trío negro', note: 'Manga corta y manga larga', alt: 'Tres camisetas negras en perchas' },
  { src: '/images/temporada/cuello-v.jpg', name: 'Cuello en V', note: 'Blanca, tela ligera', alt: 'Camiseta blanca de cuello en V en un perchero' },
  { src: '/images/temporada/blanco-negro.jpg', name: 'Blanco y negro', note: 'Básicos para combinar', alt: 'Camisetas blancas y negras alternadas en un perchero' },
  { src: '/images/temporada/perchero.jpg', name: 'Perchero completo', note: 'Toda la temporada', alt: 'Perchero con camisetas negras y blancas' },
];

// Anillo 3D de camisas para la portada: gira solo (una vuelta cada 30 s), se
// frena con el cursor encima, se arrastra con inercia y encaja en la más
// cercana; todo el anillo se inclina con el cursor y una línea holográfica
// escanea la camisa del frente. Se pausa fuera de pantalla y con la pestaña oculta.
@Component({
  selector: 'app-shirt-orbit',
  templateUrl: './shirt-orbit.html',
  styleUrl: './shirt-orbit.css',
  host: { role: 'region', 'aria-roledescription': 'carrusel', 'aria-label': 'Camisas de la temporada' },
})
export class ShirtOrbit implements OnDestroy {
  readonly shirts = TEMPORADA;
  frontName = signal(TEMPORADA[0].name);
  frontNote = signal(TEMPORADA[0].note);

  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private cleanups: Array<() => void> = [];
  private stepTo?: (dir: number) => void;

  constructor() {
    afterNextRender(() => this.zone.runOutsideAngular(() => this.init()));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach(fn => fn());
  }

  anterior(): void {
    this.stepTo?.(1);
  }

  siguiente(): void {
    this.stepTo?.(-1);
  }

  private init(): void {
    const root = this.host.nativeElement;
    const stage = root.querySelector<HTMLElement>('.orbit-stage')!;
    const tiltBox = root.querySelector<HTMLElement>('.tilt-box')!;
    const ring = root.querySelector<HTMLElement>('.ring')!;
    const cards = [...ring.querySelectorAll<HTMLElement>('.shirt')];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const n = cards.length, step = 360 / n;
    const AUTO = -0.012; // grados por milisegundo

    let R = 360, angle = 0, vel = 0, target: number | null = null, dragging = false, hover = false;
    let lastX = 0, lastT = 0, front = -1, last = 0, visible = true, ticking = false;

    const layout = () => {
      R = parseFloat(getComputedStyle(root).getPropertyValue('--r')) || 360;
      cards.forEach((c, i) => (c.style.transform = `rotateY(${i * step}deg) translateZ(${R}px)`));
    };
    const paint = () => {
      ring.style.transform = `translateZ(${-R}px) rotateY(${angle.toFixed(2)}deg)`;
      let best = 0, bestCos = -2;
      cards.forEach((c, i) => {
        const cos = Math.cos(((i * step + angle) * Math.PI) / 180);
        const v = ((1 - (cos + 1) / 2) * 0.82).toFixed(2);
        if (c.dataset['shade'] !== v) { c.dataset['shade'] = v; c.style.setProperty('--shade', v); }
        if (cos > bestCos) { bestCos = cos; best = i; }
      });
      if (best !== front) {
        cards[front]?.classList.remove('front');
        front = best;
        cards[front].classList.add('front');
        this.zone.run(() => {
          this.frontName.set(this.shirts[front].name);
          this.frontNote.set(this.shirts[front].note);
        });
        // El rótulo entra con un leve desenfoque cada vez que cambia la camisa.
        if (!reduced.matches) {
          root.querySelector('.swap')?.animate(
            [{ opacity: 0, transform: 'translateY(8px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'none' }],
            { duration: 500, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
          );
        }
      }
    };
    const snap = (dir: number) => -(Math.round(-angle / step) + dir) * step;
    const tick = (now: number) => {
      const dt = Math.min(48, now - (last || now));
      last = now;
      if (!dragging) {
        if (target !== null) {
          angle += (target - angle) * (1 - Math.pow(0.86, dt / 16.7));
          if (Math.abs(target - angle) < 0.05) { angle = target; target = null; }
        } else if (Math.abs(vel) > 0.002) {
          angle += vel * dt;
          vel *= Math.pow(0.94, dt / 16.7);
          if (Math.abs(vel) <= 0.002) target = snap(0);
        } else if (!hover && !reduced.matches) {
          angle += AUTO * dt;
        }
      }
      paint();
      const moving = dragging || target !== null || Math.abs(vel) > 0.002 || (!hover && !reduced.matches);
      if (visible && !document.hidden && moving) requestAnimationFrame(tick);
      else { ticking = false; last = 0; }
    };
    const kick = () => {
      if (!ticking && visible && !document.hidden) { ticking = true; requestAnimationFrame(tick); }
    };
    this.stepTo = dir => { vel = 0; target = snap(dir); kick(); };

    const onDown = (e: PointerEvent) => {
      dragging = true; target = null; vel = 0; lastX = e.clientX; lastT = performance.now();
      stage.classList.add('dragging');
      stage.setPointerCapture(e.pointerId);
      kick();
    };
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      if (fine.matches && !reduced.matches) {
        tiltBox.style.setProperty('--tx', (-6 - ((e.clientY - r.top) / r.height - 0.5) * 10).toFixed(2) + 'deg');
        tiltBox.style.setProperty('--ty', (((e.clientX - r.left) / r.width - 0.5) * 10).toFixed(2) + 'deg');
      }
      if (!dragging) return;
      const now = performance.now(), dx = e.clientX - lastX;
      angle += dx * 0.32;
      vel = (dx * 0.32) / Math.max(1, now - lastT);
      lastX = e.clientX; lastT = now;
    };
    const release = () => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('dragging');
      if (Math.abs(vel) < 0.02) target = snap(0);
      kick();
    };
    const onEnter = () => { hover = true; };
    const onLeave = () => {
      hover = false;
      release();
      tiltBox.style.setProperty('--tx', '-6deg');
      tiltBox.style.setProperty('--ty', '0deg');
      kick();
    };
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('pointerenter', onEnter);
    stage.addEventListener('pointerleave', onLeave);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); });
    io.observe(root);
    document.addEventListener('visibilitychange', kick);
    addEventListener('resize', layout);
    layout();
    paint();
    kick();

    this.cleanups.push(() => {
      io.disconnect();
      document.removeEventListener('visibilitychange', kick);
      removeEventListener('resize', layout);
    });
  }
}
