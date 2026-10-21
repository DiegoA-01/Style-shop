import { Component, computed, input, signal } from '@angular/core';
import { RevealDirective } from './reveal.directive';

export interface BarItem {
  label: string;
  value: number;
  // Líneas extra del tooltip y de la tabla (porcentaje, variación, etc.).
  detail: string[];
}

// Gráfica de barras de una sola serie (sin leyenda: el título la nombra).
// Barras finas que crecen desde la base, etiqueta solo en el valor más alto,
// tooltip al pasar el cursor o con el teclado, y una vista de tabla equivalente.
@Component({
  selector: 'app-bar-chart',
  imports: [RevealDirective],
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.css',
})
export class BarChart {
  items = input.required<BarItem[]>();
  // Qué mide la gráfica; se usa en el tooltip, la tabla y para lectores de pantalla.
  measure = input.required<string>();
  format = input<(value: number) => string>(value => String(value));

  hovered = signal<number | null>(null);
  asTable = signal(false);

  // Escala con números redondos: 4 o 5 divisiones de un paso "bonito" (1, 2, 2.5, 5 × 10^n).
  scale = computed(() => {
    const max = Math.max(0, ...this.items().map(i => i.value));
    if (max === 0) {
      return { top: 1, ticks: [0] };
    }
    const raw = max / 4;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(n => n * pow).find(s => s >= raw)!;
    const top = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let t = 0; t <= top + step / 2; t += step) ticks.push(t);
    return { top, ticks };
  });

  // Índice de la barra más alta: la única con etiqueta directa.
  peak = computed(() => {
    const values = this.items().map(i => i.value);
    const max = Math.max(0, ...values);
    return max > 0 ? values.indexOf(max) : -1;
  });

  percentOf(value: number): number {
    return (value / this.scale().top) * 100;
  }

  ariaFor(item: BarItem): string {
    return [`${item.label}: ${this.format()(item.value)}`, ...item.detail].join('. ');
  }
}
