import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Para gestionar el catálogo (crear/editar/eliminar productos y categorías,
// subir imágenes): exige TRABAJADOR o SUPER_ADMIN. Un USUARIO normal (registro
// público) está logueado pero no pasa este guard, igual que el backend.
export const staffGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (!authService.isStaff()) {
    router.navigate(['/products']);
    return false;
  }

  return true;
};
