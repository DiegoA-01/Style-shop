import { AbstractControl, ValidationErrors } from '@angular/forms';

// Validador de grupo: "password" y "confirmPassword" deben coincidir.
export function passwordsIguales(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsDistintas: true };
}
