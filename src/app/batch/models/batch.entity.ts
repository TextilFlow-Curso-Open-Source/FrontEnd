// src/app/batch/models/batch.entity.ts
export interface Batch {
  id?: number;
  code: string;
  client: string;
  fabricType: string;
  color: string;
  quantity: number;
  price: number;
  observations?: string;
  date: string;
  imageUrl?: string;
  status?: 'Enviado' | 'Por enviar';
  supplierId: number;
}
