// src/app/configuration/services/configuration.service.ts

import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service.service';
import { Configuration } from '../models/configuration.entity';
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService extends BaseService<Configuration> {
  constructor() {
    super();
    this.resourceEndpoint = environment.configurationEndpointPath;
  }

  // Método para obtener la configuración por usuario
  getByUserId(userId: number) {
    return this.http.get<Configuration>(
      `${this.resourcePath()}?userId=${userId}`,
      this.httpOptions
    );
  }
}
