// /src/app/core/models/business-supplier-request.model.ts
export class BusinessSupplierRequest {
  id?: string;
  businessmanId: string;
  supplierId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  // Nuevos campos para el formulario de solicitud
  batchType?: string;    // Tipo de tela
  color?: string;        // Color de tela
  quantity?: number | null;     // Cantidad - modificado para aceptar null
  address?: string;      // Dirección para entrega
  createdAt?: string;
  updatedAt?: string;

  constructor(data: {
    id?: string;
    businessmanId: string;
    supplierId: string;
    status?: 'pending' | 'accepted' | 'rejected';
    message?: string;
    // Nuevos campos opcionales
    batchType?: string;
    color?: string;
    quantity?: number | null;  // Modificado para aceptar null
    address?: string;
    createdAt?: string;
    updatedAt?: string;
  }) {
    this.id = data.id;
    this.businessmanId = data.businessmanId;
    this.supplierId = data.supplierId;
    this.status = data.status || 'pending';
    this.message = data.message;
    // Inicializar los nuevos campos
    this.batchType = data.batchType;
    this.color = data.color;
    this.quantity = data.quantity;
    this.address = data.address;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt;
  }
}
