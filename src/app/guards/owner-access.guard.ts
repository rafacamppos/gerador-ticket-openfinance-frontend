import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { PortalAuthService } from '../services/portal-auth.service';

export const ownerAccessGuard: CanActivateFn = async (route) => {
  const authService = inject(PortalAuthService);
  const router = inject(Router);
  const ownerSlug = route.paramMap.get('ownerSlug') || '';

  try {
    const authenticated = await authService.ensureSession();
    if (!authenticated) {
      return router.parseUrl('/login');
    }

    return authService.canAccessOwner(ownerSlug)
      ? true
      : router.parseUrl(authService.getHomeRoute());
  } catch {
    return router.parseUrl('/login');
  }
};
