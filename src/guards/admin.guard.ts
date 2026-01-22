import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();

  if (user && user.role === 'admin') {
    return true;
  }

  // Not admin -> redirect to dashboard or login
  return router.createUrlTree(['/dashboard']);
};