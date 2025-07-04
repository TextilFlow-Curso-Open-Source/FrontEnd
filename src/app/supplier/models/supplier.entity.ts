// /src/app/supplier/models/supplier.entity.ts
import { User } from '../../auth/models/user.entity';

export class Supplier extends User {
  // SOLO datos que existen en el backend
  companyName: string;
  ruc: string;
  specialization: string;
  description: string;
  certifications: string; // Este SÍ existe en el backend
  logo: string;

  constructor(supplier: {
    id?: string,
    name?: string,
    email?: string,
    password?: string,
    role?: 'businessman' | 'supplier' | 'pending',
    country?: string,
    city?: string,
    address?: string,
    phone?: string,
    // Solo campos que existen en el backend
    companyName?: string,
    ruc?: string,
    specialization?: string,
    description?: string,
    certifications?: string,
    logo?: string
  }) {
    super(supplier);

    // Solo inicializar campos que existen en el backend
    this.companyName = supplier.companyName || '';
    this.ruc = supplier.ruc || '';
    this.specialization = supplier.specialization || '';
    this.description = supplier.description || '';
    this.certifications = supplier.certifications || '';
    this.logo = supplier.logo || '';
  }
}
