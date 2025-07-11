export class SupplierReview {
  id?: string;
  supplierId: string;
  businessmanId: string;
  rating: number;
  comment: string;
  createdAt: string;
  businessmanName?: string;
  businessmanLogo?: string;
  canEdit?: boolean;
  constructor(data: {
    id?: string;
    supplierId: string;
    businessmanId: string;
    rating: number;
    comment?: string;
    createdAt?: string;
    businessmanName?: string;
    businessmanLogo?: string;
    canEdit?: boolean;
  }) {
    this.id = data.id;
    this.supplierId = data.supplierId;
    this.businessmanId = data.businessmanId;
    this.rating = data.rating;
    this.comment = data.comment || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.businessmanName = data.businessmanName;
    this.businessmanLogo = data.businessmanLogo || 'assets/default-avatar.png';
    this.canEdit = data.canEdit || false;
  }
  /**
   * Helper method to verify if the review is valid
   */
  isValid(): boolean {
    return this.rating >= 1 &&
      this.rating <= 5 &&
      this.supplierId.length > 0 &&
      this.businessmanId.length > 0;
  }
  /**
   * Helper method to get the rating as an array of stars
   */
  getStarsArray(): boolean[] {
    return Array.from({length: 5}, (_, i) => i < this.rating);
  }
  /**
   * Helper method to format the creation date
   */
  getFormattedDate(): string {
    try {
      return new Date(this.createdAt).toLocaleDateString();
    } catch {
      return this.createdAt;
    }
  }
}
