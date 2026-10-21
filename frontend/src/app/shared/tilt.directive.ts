import { Directive, ElementRef, NgZone, OnDestroy, afterNextRender, inject } from '@angular/core';

// Inclinación 3D suave que sigue al cursor, con un brillo de luz encima
// (estilos en `.tilt` de styles.css). Solo escribe variables CSS, una vez por
// frame como máximo, y no hace nada en pantallas táctiles ni con movimiento reducido.
@Directive({
  selector: '[appTilt]',
  host: { class: 'tilt' },
})
export class TiltDirective implements OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private cleanup?: () => void;

  constructor() {
    afterNextRender(() => this.zone.runOutsideAngular(() => this.init()));
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }

  private init(): void {
    const node = this.el.nativeElement;
    const canTilt = matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const MAX = 5; // grados

    let raf: number | null = null;
    let px = 0.5, py = 0.5;

    const write = () => {
      raf = null;
      node.style.setProperty('--rx', ((0.5 - py) * MAX * 2).toFixed(2) + 'deg');
      node.style.setProperty('--ry', ((px - 0.5) * MAX * 2).toFixed(2) + 'deg');
      node.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      node.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    };

    const onMove = (e: PointerEvent) => {
      if (!canTilt.matches || reduced.matches) return;
      const r = node.getBoundingClientRect();
      px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      node.classList.add('tilting');
      if (raf === null) raf = requestAnimationFrame(write);
    };

    const onLeave = () => {
      if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
      node.classList.remove('tilting');
      node.style.setProperty('--rx', '0deg');
      node.style.setProperty('--ry', '0deg');
    };

    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    this.cleanup = () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }
}
