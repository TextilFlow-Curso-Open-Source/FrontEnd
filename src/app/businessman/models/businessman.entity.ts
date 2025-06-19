// /src/app/businessman/models/businessman.entity.ts
import { User } from '../../auth/models/user.entity';

export class Businessman extends User {
  // Solo datos específicos de Businessman
  companyName: string;
  ruc: string;
  businessType: string;
  industry: string;
  employeeCount: number;
  foundingYear: number;
  website: string;
  description: string;
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
    companyName?: string,
    ruc?: string,
    businessType?: string,
    industry?: string,
    employeeCount?: number,
    foundingYear?: number,
    website?: string,
    description?: string,
    logo?: string
  }) {
    // Llamamos al constructor de la clase padre (User)
    super(businessman);

    // Inicializamos las propiedades específicas de Businessman
    this.companyName = businessman.companyName || '';
    this.ruc = businessman.ruc || '';
    this.businessType = businessman.businessType || '';
    this.industry = businessman.industry || '';
    this.employeeCount = businessman.employeeCount || 0;
    this.foundingYear = businessman.foundingYear || new Date().getFullYear();
    this.website = businessman.website || '';
    this.description = businessman.description || '';
    this.logo = businessman.logo || '';
  }
}
