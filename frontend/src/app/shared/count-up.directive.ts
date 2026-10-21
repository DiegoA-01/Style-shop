import { Directive, ElementRef, OnDestroy, effect, inject, input } from '@angular/core';

// Hace que una cifra "cuente" desde el valor anterior hasta el nuevo cuando
// cambia (o desde 0 la primera vez). Escribe el texto como máximo una vez por
// frame y solo si cambió; con movimiento reducido pone el valor final directo.
@Directive({
  selector: '[appCountUp]',
})
export class CountUpDirective implements OnDestroy {
  appCountUp = input.required<number>();
  countFormat = input<(value: number) => string>(value => String(Math.round(value)));

  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private shown = 0;
  private raf: number | null = null;

  constructor() {
    effect(() => {
      const target = Number(this.appCountUp()) || 0;
      const format = this.countFormat();
      this.animate(target, format);
    });
  }

  ngOnDestroy(): void {
    if (this.raf !== null) cancelAnimationFrame(this.raf);
  }

  private animate(target: number, format: (value: number) => string): void {
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    const node = this.el.nativeElement;

    if (matchMedia('(prefers-reduced-motion: reduce)').matches || target === this.shown) {
      this.shown = target;
      node.textContent = format(target);
      return;
    }

    const from = this.shown;
    const start = performance.now();
    const duration = 1100;
    let last = '';

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      const value = from + (target - from) * eased;
      // Enteros mientras cuenta (sin decimales que titilan); el valor exacto al final.
      const text = t < 1 ? format(Math.round(value)) : format(target);
      if (text !== last) {
        node.textContent = text;
        last = text;
      }
      this.shown = t < 1 ? value : target;
      this.raf = t < 1 ? requestAnimationFrame(step) : null;
    };
    this.raf = requestAnimationFrame(step);
  }
}
