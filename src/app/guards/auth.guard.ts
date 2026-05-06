import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { MockAuthService } from '../service/authService/mock-auth.service';

export const authGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const authService = inject(MockAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: {
      returnUrl: state.url
    }
  });
};
