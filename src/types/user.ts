export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user' | 'attendant';
  permissions: string[];
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Application {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
} 