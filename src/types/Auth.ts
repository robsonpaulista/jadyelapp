export interface AuthProps {
  id: string;
  username: string;
  nome: string;
  name: string;
  email: string;
  perfil: string;
  level: string;
  permissions: string[];
  token: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    nome: string;
    name: string;
    email: string;
    perfil: string;
    level: string;
    permissions?: string[];
  };
  token: string;
  message?: string;
} 