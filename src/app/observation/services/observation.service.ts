// src/app/batch/services/observation.service.ts

import { Injectable } from '@angular/core';
import { BaseService } from '../../core/services/base.service.service';
import { Observation } from '../models/observation.entity';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ObservationService extends BaseService<Observation> {
  constructor() {
    super();
    this.resourceEndpoint = environment.observationEndpointPath;
  }
}
