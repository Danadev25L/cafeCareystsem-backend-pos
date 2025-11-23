export enum Role {
  ADMIN = 'ADMIN',
  CAPTAIN = 'CAPTAIN',
  CASHIER = 'CASHIER'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}