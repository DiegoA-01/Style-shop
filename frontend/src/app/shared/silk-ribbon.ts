import { Component, ElementRef, NgZone, OnDestroy, afterNextRender, inject, input } from '@angular/core';
import { drawSilk } from './silk';

// La seda del home en pequeño, quieta en una pose (`pose`: 0 cuelga, 0.5 cae,
// 1 doblada) y respirando despacio. Solo anima mientras está en pantalla y la
// pestaña visible; con movimiento reducido se dibuja una vez y se queda quieta.
@Component({
  selector: 'app-silk-ribbon',
  template: '<canvas aria-hidden="true"></canvas>',
  styles: [':host { display: block; position: relative; } canvas { position: absolute; inset: 0; width: 100%; height: 100%; }'],
})
export class SilkRibbon implements OnDestroy {
  pose = input(0.3);

  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private cleanup?: () => void;

  constructor() {
    afterNextRender(() => this.zone.runOutsideAngular(() => this.init()));
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }

  private init(): void {
    const canvas = this.host.nativeElement.querySelector('canvas')!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let W = 0, H = 0, raf: number | null = null, visible = true;

    const draw = (time: number) => {
      if (W && H) drawSilk(ctx, W, H, this.pose(), time);
    };
    const loop = (time: number) => {
      draw(time);
      raf = visible && !document.hidden && !reduced.matches ? requestAnimationFrame(loop) : null;
    };
    const kick = () => {
      if (raf === null && visible && !document.hidden && !reduced.matches) raf = requestAnimationFrame(loop);
    };
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); });
    io.observe(canvas);
    document.addEventListener('visibilitychange', kick);
    reduced.addEventListener('change', kick);
    resize();
    kick();

    this.cleanup = () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', kick);
      reduced.removeEventListener('change', kick);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }
}
