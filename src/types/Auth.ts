export interface AuthProps {
  id: number;
  username: string;
  nome: string;
  email: string;
  perfil: string;
  permissions: string[];
  token: string;
}

export interface LoginResponse {
  user: {
    id: number;
    username: string;
    nome: string;
    email: string;
    perfil: string;
    permissions?: string[];
  };
  token: string;
  message?: string;
} 