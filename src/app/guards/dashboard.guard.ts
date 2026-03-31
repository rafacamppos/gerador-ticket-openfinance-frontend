import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { PortalAuthService } from '../services/portal-auth.service';

export const dashboardGuard: CanActivateFn = async () => {
  const authService = inject(PortalAuthService);
  const router = inject(Router);

  try {
    const authenticated = await authService.ensureSession();
    if (!authenticated) {
      return router.parseUrl('/login');
    }

    return authService.getProfile() === 'adm'
      ? true
      : router.parseUrl(authService.getHomeRoute());
  } catch {
    return router.parseUrl('/login');
  }
};
