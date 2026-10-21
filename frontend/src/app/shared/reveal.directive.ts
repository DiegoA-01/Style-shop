import { Directive, ElementRef, OnDestroy, afterNextRender, inject } from '@angular/core';

// Hace aparecer el elemento (clase `.reveal` en styles.css) cuando entra en
// pantalla. Al terminar la entrada agrega `.settled`, que las pantallas usan
// para retirar los retrasos escalonados y que los hover respondan al instante.
@Directive({
  selector: '[appReveal]',
  host: { class: 'reveal' },
})
export class RevealDirective implements OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private io?: IntersectionObserver;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    afterNextRender(() => {
      this.io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          const node = this.el.nativeElement;
          node.classList.add('in');
          this.io?.disconnect();
          this.timer = setTimeout(() => node.classList.add('settled'), 1600);
        },
        { threshold: 0.15 },
      );
      this.io.observe(this.el.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
    clearTimeout(this.timer);
  }
}
