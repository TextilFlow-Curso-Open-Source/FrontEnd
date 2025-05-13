import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {inject} from '@angular/core';
import {catchError, Observable, retry, throwError} from 'rxjs';

/**
 * Abstract base service class providing common CRUD operations for REST API endpoints.
 * @template T The type of resource this service manages
 */
export abstract class BaseService<T> {
  /** HTTP headers configuration for JSON communication */
  protected httpOptions = { headers: new HttpHeaders({'Content-Type': 'application/json'})};
  /** Base URL for the server API */
  protected serverBaseUrl: string =  `${environment.serverBaseUrl}`;
  /** Endpoint path for the specific resource */
  protected resourceEndpoint: string = '/resources';
  /** HTTP client for making API requests */
  protected http: HttpClient = inject(HttpClient);

  /**
   * Handles HTTP errors and transforms them into an Observable error
   * @param error - The HTTP error response
   * @returns An Observable error with a user-friendly message
   */
  protected handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error(`An error occurred: ${error.error.message}`);
    } else {
      console.error(`Backend returned code ${error.status}, body was: ${error.error}`);
    }
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  /**
   * Constructs the full resource URL path
   * @returns The complete URL for the resource endpoint
   */
  protected resourcePath(): string {
    return `${this.serverBaseUrl}${this.resourceEndpoint}`;
  }

  /**
   * Creates a new resource
   * @param resource - The resource to create
   * @returns An Observable of the created resource
   */
  public create(resource: T): Observable<T> {
    return this.http.post<T>(this.resourcePath(), JSON.stringify(resource), this.httpOptions)
      .pipe(retry(2), catchError(this.handleError));
  }

  /**
   * Deletes a resource by ID
   * @param id - The ID of the resource to delete
   * @returns An Observable of the deletion result
   */
  public delete(id: any): Observable<any> {
    return this.http.delete(`${this.resourcePath()}/${id}`, this.httpOptions)
      .pipe(retry(2), catchError(this.handleError));
  }

  /**
   * Updates an existing resource
   * @param id - The ID of the resource to update
   * @param resource - The updated resource data
   * @returns An Observable of the updated resource
   */
  public update(id: any, resource: T): Observable<T> {
    return this.http.put<T>(`${this.resourcePath()}/${id}`, JSON.stringify(resource), this.httpOptions)
      .pipe(retry(2), catchError(this.handleError));
  }

  /**
   * Retrieves all resources
   * @returns An Observable array of all resources
   */
  public getAll(): Observable<Array<T>> {
    return this.http.get<Array<T>>(this.resourcePath(), this.httpOptions)
      .pipe(retry(2), catchError(this.handleError));
  }

  /**
   * Retrieves a resource by ID
   * @param id - The ID of the resource to retrieve
   * @returns An Observable of the requested resource
   */
  public getById(id: any): Observable<T> {
    return this.http.get<T>(`${this.resourcePath()}/${id}`, this.httpOptions)
      .pipe(retry(2), catchError(this.handleError));
  }
}
