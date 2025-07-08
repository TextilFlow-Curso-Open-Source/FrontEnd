// src/app/batch/models/batch.entity.ts

export const STATUS = {
  PENDIENTE: 'PENDIENTE',     // ← Cambiar de 'Pendiente' a 'PENDIENTE'
  ACEPTADO: 'ACEPTADO',       // ← Cambiar de 'Aceptado' a 'ACEPTADO'
  RECHAZADO: 'RECHAZADO',     // ← Cambiar de 'Rechazado' a 'RECHAZADO'
  COMPLETADO: 'COMPLETADO',   // ← Cambiar de 'Completado' a 'COMPLETADO'
  POR_ENVIAR: 'POR_ENVIAR',   // ← Cambiar de 'Por enviar' a 'POR_ENVIAR'
  ENVIADO: 'ENVIADO'          // ← Cambiar de 'Enviado' a 'ENVIADO'
} as const;

export type BatchStatus = typeof STATUS[keyof typeof STATUS];

export class Batch {
  id?: string;              // ← CAMBIO: number → string
  code: string;
  client: string;
  businessmanId: string;    // ← CAMBIO: number → string
  supplierId: string;       // ← CAMBIO: number → string
  fabricType: string;
  color: string;
  quantity: number;
  price: number;
  observations?: string;
  address?: string;
  date: string;
  status: BatchStatus;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string;

  constructor(data: {
    id?: string;            // ← CAMBIO: number → string
    code: string;
    client: string;
    businessmanId: string;  // ← CAMBIO: number → string
    supplierId: string;     // ← CAMBIO: number → string
    fabricType: string;
    color: string;
    quantity: number;
    price: number;
    observations?: string;
    address?: string;
    date: string;
    status: BatchStatus;
    createdAt?: string;
    updatedAt?: string;
    imageUrl?: string;
  }) {
    this.id = data.id;
    this.code = data.code;
    this.client = data.client;
    this.businessmanId = data.businessmanId;
    this.supplierId = data.supplierId;
    this.fabricType = data.fabricType;
    this.color = data.color;
    this.quantity = data.quantity;
    this.price = data.price;
    this.observations = data.observations;
    this.address = data.address;
    this.date = data.date;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.imageUrl = data.imageUrl;
  }
}

// También convertimos BatchRequest a clase
export const REQUEST_STATUS = {
  PENDIENTE: 'PENDIENTE',     // ← Cambiar de 'Pendiente' a 'PENDIENTE'
  ACEPTADO: 'ACEPTADO',       // ← Cambiar de 'Aceptado' a 'ACEPTADO'
  RECHAZADO: 'RECHAZADO',     // ← Cambiar de 'Rechazado' a 'RECHAZADO'
  COMPLETADO: 'COMPLETADO'    // ← Cambiar de 'Completado' a 'COMPLETADO'
} as const;

export type BatchRequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

export class BatchRequest {
  id?: string;              // ← CAMBIO: number → string
  businessmanId: string;    // ← CAMBIO: number → string
  supplierId: string;       // ← CAMBIO: number → string
  batchType: string;
  color: string;
  quantity: number;
  address: string;
  comments?: string;
  status: BatchRequestStatus;
  createdAt: string;
  updatedAt?: string;

  constructor(data: {
    id?: string;            // ← CAMBIO: number → string
    businessmanId: string;  // ← CAMBIO: number → string
    supplierId: string;     // ← CAMBIO: number → string
    batchType: string;
    color: string;
    quantity: number;
    address: string;
    comments?: string;
    status: BatchRequestStatus;
    createdAt: string;
    updatedAt?: string;
  }) {
    this.id = data.id;
    this.businessmanId = data.businessmanId;
    this.supplierId = data.supplierId;
    this.batchType = data.batchType;
    this.color = data.color;
    this.quantity = data.quantity;
    this.address = data.address;
    this.comments = data.comments;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
