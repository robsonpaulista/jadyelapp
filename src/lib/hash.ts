import bcrypt from 'bcrypt';

/**
 * Gera um hash seguro para a senha usando bcrypt
 * @param password Senha em texto plano
 * @returns Hash da senha
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Verifica se uma senha em texto plano corresponde a um hash
 * @param plainPassword Senha em texto plano
 * @param hashedPassword Hash da senha armazenado
 * @returns Boolean indicando se a senha corresponde ao hash
 */
export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Verifica se a senha é forte o suficiente
 * @param password Senha para verificar
 * @returns Objeto com resultado e mensagem
 */
export const validatePasswordStrength = (
  password: string
): { isValid: boolean; message?: string } => {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: 'A senha deve ter pelo menos 8 caracteres',
    };
  }

  // Verificar pelo menos uma letra maiúscula
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos uma letra maiúscula',
    };
  }

  // Verificar pelo menos uma letra minúscula
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos uma letra minúscula',
    };
  }

  // Verificar pelo menos um número
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos um número',
    };
  }

  // Verificar pelo menos um caractere especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos um caractere especial',
    };
  }

  return { isValid: true };
}; 