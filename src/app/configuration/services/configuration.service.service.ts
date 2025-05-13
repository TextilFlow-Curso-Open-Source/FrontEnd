import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service.service';
import { Configuration } from '../models/configuration.entity';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * API endpoint path for configurations
 */
const configurationResourceEndpointPath = '/configurations';

/**
 * Service responsible for managing user configurations
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigurationServiceService extends BaseService<Configuration> {
  
  constructor() {
    super();
    this.resourceEndpoint = configurationResourceEndpointPath;
  }

  /**
   * Gets the configuration for a specific user
   * 
   * @param userId - The ID of the user
   * @param userRole - The role of the user (businessman or supplier)
   * @returns An Observable of the user's configuration
   */
  getUserConfiguration(userId: number, userRole: 'businessman' | 'supplier'): Observable<Configuration> {
    return this.http.get<Configuration[]>(`${this.serverBaseUrl}${this.resourceEndpoint}?userId=${userId}`)
      .pipe(
        map(configs => {
          // If configuration exists, return it
          if (configs && configs.length > 0) {
            return configs[0];
          }
          
          // If no configuration exists, create a default one
          const defaultConfig = new Configuration(userId, userRole);
          return defaultConfig;
        }),
        catchError(error => {
          console.error('Error fetching user configuration:', error);
          // Return a default configuration in case of error
          return of(new Configuration(userId, userRole));
        })
      );
  }

  /**
   * Saves or updates a user's configuration
   * 
   * @param config - The configuration to save
   * @returns An Observable of the saved configuration
   */
  saveConfiguration(config: Configuration): Observable<Configuration> {
    // If the configuration has an ID, update it
    if (config.id) {
      return this.update(config.id, config);
    }
    
    // Otherwise create a new configuration
    return this.create(config);
  }

  /**
   * Resets a user's configuration to default values
   * 
   * @param userId - The ID of the user
   * @param userRole - The role of the user (businessman or supplier)
   * @returns An Observable of the reset configuration
   */
  resetConfiguration(userId: number, userRole: 'businessman' | 'supplier'): Observable<Configuration> {
    return this.getUserConfiguration(userId, userRole).pipe(
      map(config => {
        const resetConfig = config.resetToDefaults();
        return resetConfig;
      }),
      catchError(error => {
        console.error('Error resetting configuration:', error);
        return of(new Configuration(userId, userRole));
      })
    );
  }
}
