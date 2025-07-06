import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { inject } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Abstract base service class providing common CRUD operations for REST API endpoints.
 * Adapted for Spring Boot backend with JWT authentication and Long IDs
 * @template T The type of resource this service manages
 */
export abstract class BaseService<T> {
  /** Base URL for the server API */
  protected serverBaseUrl: string = `${environment.serverBaseUrl}`;
  /** Endpoint path for the specific resource */
  protected resourceEndpoint: string = '/resources';
  /** HTTP client for making API requests */
  protected http: HttpClient = inject(HttpClient);

  /** HTTP headers configuration for JSON communication - MANTENER COMPATIBLE */
  protected get httpOptions() {
    return this.getHttpOptions();
  }

  /**
   * Gets HTTP headers with authentication if available
   * @returns HTTP headers configuration
   */
  protected getHttpOptions(): { headers: HttpHeaders } {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Add JWT token if available and not fake
    const token = localStorage.getItem('auth_token');
    if (token && !token.startsWith('fake-jwt-token-') && !token.startsWith('temp-jwt-token-')) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return { headers };
  }

  /**
   * Gets HTTP headers without authentication (for login/register)
   * @returns HTTP headers configuration
   */
  protected getPublicHttpOptions(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    };
  }

  /**
   * Handles HTTP errors and transforms them into an Observable error
   * @param error - The HTTP error response
   * @returns An Observable error with a user-friendly message
   */
  protected handleError(error: HttpErrorResponse) {
    let errorMessage = 'Something bad happened; please try again later.';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      console.error(`Client error: ${error.error.message}`);
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Server-side error
      console.error(`Backend returned code ${error.status}, body was:`, error.error);

      // Handle specific HTTP status codes
      switch (error.status) {
        case 400:
          errorMessage = 'Bad request - Please check your input';
          break;
        case 401:
          errorMessage = 'Unauthorized - Please log in again';
          // Could trigger logout here
          break;
        case 403:
          errorMessage = 'Forbidden - You don\'t have permission';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 500:
          errorMessage = 'Internal server error';
          break;
        default:
          errorMessage = `Server error: ${error.status}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Constructs the full resource URL path
   * @returns The complete URL for the resource endpoint
   */
  protected resourcePath(): string {
    return `${this.serverBaseUrl}${this.resourceEndpoint}`;
  }

  /**
   * Transforms string ID to Long for backend compatibility
   * @param id - String ID from frontend
   * @returns Long ID for backend
   */
  protected transformIdToLong(id: string): number {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      throw new Error(`Invalid ID format: ${id}`);
    }
    return numId;
  }

  /**
   * Transforms Long ID to string for frontend compatibility
   * @param id - Long ID from backend
   * @returns String ID for frontend
   */
  protected transformIdToString(id: number): string {
    return id.toString();
  }

  /**
   * Transforms resource before sending to backend
   * Override this method in child classes if needed
   * @param resource - Frontend resource
   * @returns Backend-compatible resource
   */
  protected transformResourceForBackend(resource: any): any {
    // Convert string ID to number if present
    if (resource.id) {
      return {
        ...resource,
        id: this.transformIdToLong(resource.id)
      };
    }
    return resource;
  }

  /**
   * Transforms resource after receiving from backend
   * Override this method in child classes if needed
   * @param resource - Backend resource
   * @returns Frontend-compatible resource
   */
  protected transformResourceFromBackend(resource: any): any {
    // Convert number ID to string if present
    if (resource.id) {
      return {
        ...resource,
        id: this.transformIdToString(resource.id)
      };
    }
    return resource;
  }

  /**
   * Creates a new resource
   * @param resource - The resource to create
   * @returns An Observable of the created resource
   */
  public create(resource: T): Observable<T> {
    const backendResource = this.transformResourceForBackend(resource);

    return this.http.post<any>(this.resourcePath(), backendResource, this.httpOptions)
      .pipe(
        map(response => this.transformResourceFromBackend(response)),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Deletes a resource by ID
   * @param id - The ID of the resource to delete (string or number)
   * @returns An Observable of the deletion result
   */
  public delete(id: any): Observable<any> {
    const resourceId = typeof id === 'string' ? this.transformIdToLong(id) : id;

    return this.http.delete(`${this.resourcePath()}/${resourceId}`, this.httpOptions)
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Updates an existing resource
   * @param id - The ID of the resource to update (string or number)
   * @param resource - The updated resource data
   * @returns An Observable of the updated resource
   */
  public update(id: any, resource: T): Observable<T> {
    const resourceId = typeof id === 'string' ? this.transformIdToLong(id) : id;
    const backendResource = this.transformResourceForBackend(resource);

    return this.http.put<any>(`${this.resourcePath()}/${resourceId}`, backendResource, this.httpOptions)
      .pipe(
        map(response => this.transformResourceFromBackend(response)),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Retrieves all resources
   * @returns An Observable array of all resources
   */
  public getAll(): Observable<Array<T>> {
    return this.http.get<Array<any>>(this.resourcePath(), this.httpOptions)
      .pipe(
        map(response => response.map(item => this.transformResourceFromBackend(item))),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Retrieves a resource by ID
   * @param id - The ID of the resource to retrieve (string or number)
   * @returns An Observable of the requested resource
   */
  public getById(id: any): Observable<T> {
    const resourceId = typeof id === 'string' ? this.transformIdToLong(id) : id;

    return this.http.get<any>(`${this.resourcePath()}/${resourceId}`, this.httpOptions)
      .pipe(
        map(response => this.transformResourceFromBackend(response)),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Custom request method for endpoints that don't follow standard REST pattern
   * @param endpoint - Custom endpoint path
   * @param method - HTTP method
   * @param body - Request body (optional)
   * @param useAuth - Whether to include authentication headers (default: true)
   * @returns Observable of the response
   */
  protected customRequest<R>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any, useAuth: boolean = true): Observable<R> {
    const url = `${this.serverBaseUrl}${endpoint}`;
    const options = useAuth ? this.httpOptions : this.getPublicHttpOptions();

    switch (method) {
      case 'GET':
        return this.http.get<R>(url, options).pipe(
          retry(2),
          catchError(this.handleError)
        );
      case 'POST':
        return this.http.post<R>(url, body, options).pipe(
          retry(2),
          catchError(this.handleError)
        );
      case 'PUT':
        return this.http.put<R>(url, body, options).pipe(
          retry(2),
          catchError(this.handleError)
        );
      case 'DELETE':
        return this.http.delete<R>(url, options).pipe(
          retry(2),
          catchError(this.handleError)
        );
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }
}
