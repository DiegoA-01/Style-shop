import { Pipe, PipeTransform } from '@angular/core';

// Formatea con tres decimales visibles: "$ 60.000,000".
const formatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

@Pipe({ name: 'copCurrency' })
export class CopCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    return formatter.format(Number(value));
  }
}
