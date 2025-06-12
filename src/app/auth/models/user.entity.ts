// /src/app/auth/models/user.entity.ts
export class User {
  id?: string; // ID como string para compatibilidad con MockAPI
  name: string;
  email: string;
  password?: string;
  role: 'businessman' | 'supplier' | 'pending';
  country: string;
  city: string;
  address: string;
  phone: string;

  constructor(user: {
    id?: string,
    name?: string,
    email?: string,
    password?: string,
    role?: 'businessman' | 'supplier' | 'pending',
    country?: string,
    city?: string,
    address?: string,
    phone?: string
  }) {
    // Solo asignar ID si viene en el constructor (para usuarios existentes)
    if (user.id) {
      this.id = user.id;
    }
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
