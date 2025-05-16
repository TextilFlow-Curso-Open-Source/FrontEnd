// /src/app/supplier/models/supplier.model.ts
import { User } from '../../auth/models/user.entity';

export class Supplier extends User {
  companyName: string;
  ruc: string;
  specialization: string;
  productCategories: string[];
  yearsFounded: number;
  warehouseLocation: string;
  minimumOrderQuantity: number;
  logo: string;
  // Nuevos campos para ratings
  averageRating?: number;
  totalReviews?: number;

  constructor(supplier: {
    // Propiedades base de User
    id?: number,
    name?: string,
    email?: string,
    password?: string,
    role?: 'businessman' | 'supplier' | 'pending',
    country?: string,
    city?: string,
    address?: string,
    phone?: string,
    // Propiedades específicas de Supplier
    companyName?: string,
    ruc?: string,
    specialization?: string,
    productCategories?: string[],
    yearsFounded?: number,
    warehouseLocation?: string,
    minimumOrderQuantity?: number,
    logo?: string,
    // Nuevos campos opcionales
    averageRating?: number,
    totalReviews?: number
  }) {
    // Llamamos al constructor de la clase padre (User)
    super(supplier);

    // Inicializamos las propiedades específicas de Supplier
    this.companyName = supplier.companyName || '';
    this.ruc = supplier.ruc || '';
    this.specialization = supplier.specialization || '';
    this.productCategories = supplier.productCategories || [];
    this.yearsFounded = supplier.yearsFounded || new Date().getFullYear();
    this.warehouseLocation = supplier.warehouseLocation || '';
    this.minimumOrderQuantity = supplier.minimumOrderQuantity || 0;
    this.logo = supplier.logo || '';
    // Inicializar nuevos campos
    this.averageRating = supplier.averageRating || 0;
    this.totalReviews = supplier.totalReviews || 0;
  }
}
