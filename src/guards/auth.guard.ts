import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Check if user is logged in
  if (auth.currentUser()) {
    return true;
  }

  // Not logged in -> redirect to login page
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // If already logged in, redirect to dashboard
  if (auth.currentUser()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
