import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Para las ventas (pedidos, cobros, mostrador): exige CAJERO o SUPER_ADMIN,
// igual que el backend.
export const sellerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (!authService.canSell()) {
    router.navigate(['/products']);
    return false;
  }

  return true;
};
