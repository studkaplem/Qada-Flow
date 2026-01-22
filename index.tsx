
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation, Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './src/app.component';
import { DashboardComponent } from './src/components/dashboard.component';
import { CalculatorComponent } from './src/components/calculator.component';
import { TrackerComponent } from './src/components/tracker.component';
import { InspireComponent } from './src/components/inspire.component';
import { ProfileComponent } from './src/components/profile.component';
import { GuideComponent } from './src/components/guide.component';
import { LoginComponent } from './src/components/auth/login.component';
import { ForgotPasswordComponent } from './src/components/auth/forgot-password.component';
import { LandingComponent } from './src/components/landing.component';
import { AdminDashboardComponent } from './src/components/admin/admin-dashboard.component';
import { authGuard, guestGuard } from './src/guards/auth.guard';
import { adminGuard } from './src/guards/admin.guard';

const routes: Routes = [
  // Public Routes (Guest Guard protects from already logged-in users)
  { path: '', component: LandingComponent, canActivate: [guestGuard] },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [guestGuard] },
  
  // Protected Routes (Auth Guard)
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'calculate', component: CalculatorComponent, canActivate: [authGuard] },
  { path: 'track', component: TrackerComponent, canActivate: [authGuard] },
  { path: 'inspire', component: InspireComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'guide', component: GuideComponent, canActivate: [authGuard] },
  
  // Admin Route
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },

  // Default redirect for unknown paths
  { path: '**', redirectTo: '' }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideRouter(routes, withHashLocation())
  ]
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
