// /src/app/auth/models/user.model.ts
export class User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: 'businessman' | 'supplier' | 'pending';
  country: string;
  city: string;
  address: string;
  phone: string;

  constructor(user: {
    id?: number,
    name?: string,
    email?: string,
    password?: string,
    role?: 'businessman' | 'supplier' | 'pending',
    country?: string,
    city?: string,
    address?: string,
    phone?: string
  }) {
    this.id = user.id || 0;
    this.name = user.name || '';
    this.email = user.email || '';
    this.password = user.password;
    this.role = user.role || 'pending';
    this.country = user.country || '';
    this.city = user.city || '';
    this.address = user.address || '';
    this.phone = user.phone || '';
  }
}
