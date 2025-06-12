// /src/app/core/models/supplier-review.model.ts
export class SupplierReview {
  id?: string;
  supplierId: string;
  businessmanId: string;
  rating: number;        // 1-5 estrellas
  comment: string;
  createdAt: string;
  businessmanName?: string;  // Para mostrar en la UI

  constructor(data: {
    id?: string;
    supplierId: string;
    businessmanId: string;
    rating: number;
    comment?: string;
    createdAt?: string;
    businessmanName?: string;
  }) {
    this.id = data.id;
    this.supplierId = data.supplierId;
    this.businessmanId = data.businessmanId;
    this.rating = data.rating;
    this.comment = data.comment || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.businessmanName = data.businessmanName;
  }
}
