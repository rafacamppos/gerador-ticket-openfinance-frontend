import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { PortalAuthService } from '../services/portal-auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(PortalAuthService);
  const router = inject(Router);

  try {
    return (await authService.ensureSession()) || router.parseUrl('/login');
  } catch {
    return router.parseUrl('/login');
  }
};
