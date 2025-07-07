import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { ConfigurationService } from '../../configuration/services/configuration.service';

/**
 * Subscription Guard
 * Protects routes that require active subscription payment
 * Redirects to /planes if subscription status is PENDING
 */
@Injectable({
  providedIn: 'root'
})
// CORREGIR subscription.guard.ts

export class SubscriptionGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private configurationService: ConfigurationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    console.log('🛡️ SubscriptionGuard: Checking subscription status for route:', state.url);

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('❌ User not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      console.log('❌ No current user found, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }

    // If trying to access /planes, always allow
    if (state.url.includes('/planes')) {
      console.log('✅ Accessing /planes route - allowed');
      return true;
    }

    // Check subscription status
    const userId = parseInt(currentUser.id, 10);

    return this.configurationService.getConfigurationByUserId(userId).pipe(
      map(configuration => {
        console.log('📋 Configuration loaded:', configuration);

        if (!configuration) {
          console.log('❌ No configuration found, redirecting to plans');
          this.redirectToPlans(currentUser.role);
          return false;
        }

        // Check if subscription requires payment
        const subscriptionStatus = configuration.subscriptionStatus;
        console.log(' Subscription status:', subscriptionStatus);

        // *** CORRECCIÓN: Comparar con mayúsculas Y minúsculas ***
        if (subscriptionStatus === 'pending' || subscriptionStatus === 'PENDING') {
          console.log(' Subscription PENDING - redirecting to plans for payment');
          this.redirectToPlans(currentUser.role);
          return false;
        }

        if (subscriptionStatus === 'active' || subscriptionStatus === 'ACTIVE') {
          console.log(' Subscription ACTIVE - access granted');
          return true;
        }

        if (subscriptionStatus === 'expired' || subscriptionStatus === 'EXPIRED') {
          console.log('⚠️ Subscription EXPIRED - redirecting to plans for renewal');
          this.redirectToPlans(currentUser.role);
          return false;
        }

        // Fallback: if status is unknown, require payment
        console.log('❓ Unknown subscription status:', subscriptionStatus, '- redirecting to plans');
        this.redirectToPlans(currentUser.role);
        return false;
      }),
      catchError(error => {
        console.error('❌ Error checking subscription status:', error);
        // On error, redirect to plans to be safe
        this.redirectToPlans(currentUser.role);
        return of(false);
      })
    );
  }

  /**
   * Redirect user to appropriate plans page based on their role
   */
  private redirectToPlans(userRole: string): void {
    console.log('🔄 Redirecting to plans page for role:', userRole);

    if (userRole === 'businessman') {
      this.router.navigate(['/businessman/planes']);
    } else if (userRole === 'supplier') {
      this.router.navigate(['/supplier/planes']);
    } else {
      // Fallback to role selection if role is unclear
      this.router.navigate(['/select-role']);
    }
  }
}
