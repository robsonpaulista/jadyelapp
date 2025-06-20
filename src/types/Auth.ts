export interface AuthProps {
  id: string;
  username: string;
  nome: string;
  email: string;
  perfil: string;
  permissions: string[];
  token: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    nome: string;
    email: string;
    perfil: string;
    permissions?: string[];
  };
  token: string;
  message?: string;
} 