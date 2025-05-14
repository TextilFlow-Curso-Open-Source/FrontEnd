export const STATUS = {
  ENVIADO: 'Enviado',
  POR_ENVIAR: 'Por enviar'
} as const;

export type BatchStatus = typeof STATUS[keyof typeof STATUS];

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
  supplierId: number;
  status?: BatchStatus;
}
