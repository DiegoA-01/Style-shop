import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// El super admin no ve la landing de la tienda: su inicio es el panel de ventas.
export const homeGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.isAdmin() ? inject(Router).createUrlTree(['/admin']) : true;
};
