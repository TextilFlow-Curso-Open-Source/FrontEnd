
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Payment service for subscription management
 * Handles Stripe integration for subscription upgrades
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly baseUrl = environment.serverBaseUrl;
  private readonly paymentPath = environment.paymentEndpointPath;

  constructor(private http: HttpClient) {}

  /**
   * Create payment intent for subscription upgrade
   * POST /api/v1/payments/create-intent
   */
  createPaymentIntent(userId: number, subscriptionPlan: 'basic' | 'corporate'): Observable<PaymentIntentResponse> {
    const url = `${this.baseUrl}${this.paymentPath}/create-intent`;

    const requestBody = {
      userId: userId,
      subscriptionPlan: subscriptionPlan
    };

    const options = {
      headers: this.getAuthHeaders()
    };

    console.log('🔄 Creating payment intent:', requestBody);

    return this.http.post<PaymentIntentResponse>(url, requestBody, options);
  }

  /**
   * Get authentication headers with current token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(environment.tokenStorageKey);

    if (token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `${environment.tokenPrefix}${token}`
      });
    }

    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Verify payment status (optional - for additional verification)
   */
  verifyPayment(paymentIntentId: string): Observable<PaymentVerificationResponse> {
    const url = `${this.baseUrl}${this.paymentPath}/verify/${paymentIntentId}`;

    const options = {
      headers: this.getAuthHeaders()
    };

    return this.http.get<PaymentVerificationResponse>(url, options);
  }
}

/**
 * Interface for payment intent response from backend
 */
export interface PaymentIntentResponse {
  clientSecret: string;
  amount: number;
  currency: string;
  subscriptionPlan: string;
}

/**
 * Interface for payment verification response
 */
export interface PaymentVerificationResponse {
  paymentIntentId: string;
  status: string;
  subscriptionUpdated: boolean;
}
