// /src/app/businessman/models/businessman.entity.ts
import { User } from '../../auth/models/user.entity';

export class Businessman extends User {
  // SOLO datos que existen en el backend
  companyName: string;
  ruc: string;
  businessType: string;
  description: string;
  website: string;
  logo: string;

  constructor(businessman: {
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
    businessType?: string,
    description?: string,
    website?: string,
    logo?: string
  }) {
    super(businessman);

    // Solo inicializar campos que existen en el backend
    this.companyName = businessman.companyName || '';
    this.ruc = businessman.ruc || '';
    this.businessType = businessman.businessType || '';
    this.description = businessman.description || '';
    this.website = businessman.website || '';
    this.logo = businessman.logo || '';
  }
}
