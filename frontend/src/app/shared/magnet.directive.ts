import { Directive, ElementRef, NgZone, OnDestroy, afterNextRender, inject } from '@angular/core';

// Atracción magnética para botones principales: el botón se acerca un poco al
// cursor (variables --pull-x/--pull-y de .btn / .btn-line en styles.css).
// Nada en pantallas táctiles ni con movimiento reducido.
@Directive({ selector: '[appMagnet]' })
export class MagnetDirective implements OnDestroy {
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
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const onMove = (e: PointerEvent) => {
      if (!fine.matches || reduced.matches) return;
      const r = node.getBoundingClientRect();
      node.style.setProperty('--pull-x', ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px');
      node.style.setProperty('--pull-y', ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px');
    };
    const onLeave = () => {
      node.style.setProperty('--pull-x', '0px');
      node.style.setProperty('--pull-y', '0px');
    };
    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    this.cleanup = () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
    };
  }
}
