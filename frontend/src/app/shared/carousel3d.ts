import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewEncapsulation,
  afterNextRender,
  inject,
  input,
} from '@angular/core';

// Carrusel 3D para tarjetas proyectadas como `<div class="slot">…</div>`.
//  - mode 'flow': coverflow. La del frente derecha; las laterales giran 42° y retroceden.
//  - mode 'arc': pared curva. Las tarjetas forman un arco cóncavo alrededor de quien mira.
// Se arrastra con inercia y encaja en la tarjeta más cercana; también con flechas
// (botones y teclado) y tocando una tarjeta lateral. Solo anima mientras hay
// movimiento, y las tarjetas que llegan después (datos del backend) se detectan solas.
@Component({
  selector: 'app-carousel3d',
  template: `
    <div class="c3d-stage" tabindex="0" [attr.aria-label]="label() + ': usa las flechas del teclado o arrastra'">
      <div class="c3d-track"><ng-content /></div>
      <span class="c3d-floor" aria-hidden="true"></span>
    </div>
    <div class="c3d-ui">
      <button class="btn-line btn-icon" type="button" [attr.aria-label]="itemLabel() + ' anterior'" data-c3d="prev">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <div class="c3d-count glass" aria-live="polite" data-c3d="count">&nbsp;</div>
      <button class="btn-line btn-icon" type="button" [attr.aria-label]="itemLabel() + ' siguiente'" data-c3d="next">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>
  `,
  styleUrl: './carousel3d.css',
  // Sin encapsulación: las tarjetas proyectadas no llevan el atributo del
  // componente. Todo el CSS va bajo `app-carousel3d`.
  encapsulation: ViewEncapsulation.None,
  host: { '[attr.data-mode]': 'mode()', role: 'region', 'aria-roledescription': 'carrusel', '[attr.aria-label]': 'label()' },
})
export class Carousel3d implements OnDestroy {
  mode = input<'flow' | 'arc'>('flow');
  label = input('Carrusel');
  itemLabel = input('Tarjeta');
  // 'middle' arranca en la tarjeta del centro (queda bien en la pared curva).
  start = input<'first' | 'middle'>('first');

  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private cleanups: Array<() => void> = [];

  constructor() {
    afterNextRender(() => this.zone.runOutsideAngular(() => this.init()));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach(fn => fn());
  }

  private init(): void {
    const root = this.host.nativeElement;
    const stage = root.querySelector<HTMLElement>('.c3d-stage')!;
    const track = root.querySelector<HTMLElement>('.c3d-track')!;
    const count = root.querySelector<HTMLElement>('[data-c3d="count"]')!;
    const mode = this.mode();

    let slots: HTMLElement[] = [];
    let max = 0, pos = 0, vel = 0, target: number | null = null, dragging = false;
    let lastX = 0, lastT = 0, moved = 0, front = -1, last = 0, ticking = false, visible = true, started = false;

    const collect = () => {
      slots = [...track.querySelectorAll<HTMLElement>(':scope > .slot')];
      slots.forEach(s => {
        if (!s.querySelector(':scope > .slot-shade')) {
          const shade = document.createElement('span');
          shade.className = 'slot-shade';
          shade.setAttribute('aria-hidden', 'true');
          s.appendChild(shade);
        }
      });
      max = Math.max(0, slots.length - 1);
      if (!started && slots.length) {
        pos = this.start() === 'middle' ? Math.floor(max / 2) : 0;
        started = true;
      }
      pos = Math.min(pos, max);
      front = -1;
      place();
    };

    const place = () => {
      if (!slots.length) {
        count.textContent = ' ';
        return;
      }
      const w = slots[0].offsetWidth || 300;
      slots.forEach((s, i) => {
        const d = i - pos, ad = Math.abs(d), sg = Math.sign(d);
        let t: string;
        if (mode === 'flow') {
          const near = Math.min(ad, 1), far = Math.max(ad - 1, 0);
          const x = sg * (near * w * 0.72 + far * w * 0.38);
          t = `translate3d(${x.toFixed(1)}px,0,${(-ad * 160).toFixed(1)}px) rotateY(${(-sg * near * 42).toFixed(2)}deg) scale(${(1 - 0.04 * Math.min(ad, 3)).toFixed(3)})`;
        } else {
          const a = d * 24, rad = (a * Math.PI) / 180, R = w * 2.1;
          t = `translate3d(${(Math.sin(rad) * R).toFixed(1)}px,0,${(-(1 - Math.cos(rad)) * R).toFixed(1)}px) rotateY(${(-a).toFixed(2)}deg)`;
        }
        s.style.transform = t;
        s.style.zIndex = String(100 - Math.round(ad * 10));
        s.style.opacity = Math.max(0, Math.min(1, 1 - (ad - 2.4) * 0.9)).toFixed(2);
        s.style.setProperty('--shade', Math.min(ad * 0.3, 0.78).toFixed(2));
      });
      const f = Math.max(0, Math.min(max, Math.round(pos)));
      if (f !== front) {
        slots[front]?.classList.remove('front');
        front = f;
        slots[front].classList.add('front');
        count.textContent = `${front + 1} de ${slots.length}`;
        // Solo la tarjeta del frente es interactiva: las demás quedan inertes (ni foco ni clic).
        slots.forEach((s, i) => {
          const content = s.firstElementChild as HTMLElement | null;
          if (content && !content.classList.contains('slot-shade')) content.inert = i !== front;
        });
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(48, now - (last || now));
      last = now;
      if (!dragging) {
        if (target !== null) {
          pos += (target - pos) * (1 - Math.pow(0.84, dt / 16.7));
          if (Math.abs(target - pos) < 0.001) { pos = target; target = null; }
        } else if (Math.abs(vel) > 0.00005) {
          pos += vel * dt;
          vel *= Math.pow(0.92, dt / 16.7);
          if (pos < 0 || pos > max) vel *= 0.5;
          if (Math.abs(vel) <= 0.00005) target = clampIdx(Math.round(pos));
        }
      }
      place();
      const busy = dragging || target !== null || Math.abs(vel) > 0.00005;
      if (busy && visible && !document.hidden) requestAnimationFrame(tick);
      else { ticking = false; last = 0; }
    };
    const kick = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };
    const clampIdx = (i: number) => Math.max(0, Math.min(max, i));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const go = (i: number) => {
      vel = 0;
      if (reduced.matches) { pos = clampIdx(i); target = null; place(); return; }
      target = clampIdx(i);
      kick();
    };
    const spacing = () => (slots[0]?.offsetWidth || 300) * (mode === 'arc' ? 0.78 : 0.62);

    const onDown = (e: PointerEvent) => {
      if (!slots.length) return;
      dragging = true; target = null; vel = 0; moved = 0; lastX = e.clientX; lastT = performance.now();
      stage.classList.add('dragging');
      stage.setPointerCapture(e.pointerId);
      kick();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now(), dx = e.clientX - lastX;
      moved += Math.abs(dx);
      let step = -dx / spacing();
      if (pos < 0 || pos > max) step *= 0.35; // resistencia en los extremos
      pos += step;
      vel = step / Math.max(1, now - lastT);
      lastX = e.clientX; lastT = now;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('dragging');
      // Un toque sin arrastre sobre una tarjeta lateral la trae al frente;
      // sobre la del frente deja pasar el clic a su contenido.
      if (moved < 6 && e.type === 'pointerup') {
        stage.releasePointerCapture(e.pointerId);
        const hit = document.elementsFromPoint(e.clientX, e.clientY)
          .map(el => el.closest<HTMLElement>('.slot'))
          .find((el): el is HTMLElement => !!el && slots.includes(el));
        const i = hit ? slots.indexOf(hit) : -1;
        if (i >= 0 && i !== front) { go(i); return; }
        if (i === front) {
          const inner = document.elementsFromPoint(e.clientX, e.clientY)
            .find(el => hit!.contains(el) && el !== hit && (el as HTMLElement).closest('a, button'));
          (inner?.closest('a, button') as HTMLElement | null)?.click();
        }
      }
      if (Math.abs(vel) < 0.0008 || pos < 0 || pos > max) target = clampIdx(Math.round(pos));
      kick();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(front + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(front - 1); }
    };
    const prev = root.querySelector<HTMLElement>('[data-c3d="prev"]')!;
    const next = root.querySelector<HTMLElement>('[data-c3d="next"]')!;
    const onPrev = () => go(front - 1);
    const onNext = () => go(front + 1);

    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('keydown', onKey);
    prev.addEventListener('click', onPrev);
    next.addEventListener('click', onNext);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(root);
    const mo = new MutationObserver(collect);
    mo.observe(track, { childList: true });
    const onResize = () => place();
    addEventListener('resize', onResize);
    collect();

    this.cleanups.push(() => {
      io.disconnect();
      mo.disconnect();
      removeEventListener('resize', onResize);
    });
  }
}
