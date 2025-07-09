// src/app/batch/models/observation.entity.ts

export const OBSERVATION_STATUS = {
  PENDIENTE: 'Pendiente',
  VISTO: 'Visto',
  EN_REVISION: 'EN_REVISION'
} as const;

export type ObservationStatus = typeof OBSERVATION_STATUS[keyof typeof OBSERVATION_STATUS];

export class Observation {
  id?: string;              // ← CAMBIO: number → string
  batchId: string;          // ← CAMBIO: number → string
  batchCode: string;
  businessmanId: string;    // ← CAMBIO: number → string
  supplierId: string;       // ← CAMBIO: number → string
  reason: string;
  imageUrl?: string;
  status: ObservationStatus;
  createdAt: string;
  updatedAt?: string;

  constructor(data: {
    id?: string;            // ← CAMBIO: number → string
    batchId: string;        // ← CAMBIO: number → string
    batchCode: string;
    businessmanId: string;  // ← CAMBIO: number → string
    supplierId: string;     // ← CAMBIO: number → string
    reason: string;
    imageUrl?: string;
    status: ObservationStatus;
    createdAt: string;
    updatedAt?: string;
  }) {
    this.id = data.id;
    this.batchId = data.batchId;
    this.batchCode = data.batchCode;
    this.businessmanId = data.businessmanId;
    this.supplierId = data.supplierId;
    this.reason = data.reason;
    this.imageUrl = data.imageUrl;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
