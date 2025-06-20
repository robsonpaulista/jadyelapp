import { getDatabase } from './index';
import { User } from '@/types/user';
import { hashPassword } from '@/lib/hash';

interface UserWithParsedPermissions extends Omit<User, 'permissions'> {
  permissions: string[];
}

// Definição da interface de atividades do usuário
export interface UserActivity {
  id: number;
  user_id: number;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  target_type: 'USER' | 'PATIENT' | 'SYSTEM';
  target_id?: number;
  details: string;
  ip_address?: string;
  timestamp: string;
  user_name?: string; // Opcional, preenchido ao fazer join com users
}

// Helper functions for users
export const createUser = async (user: {
  name: string;
  email: string;
  password: string;
  role?: string;
  permissions?: string[];
  active?: boolean;
}) => {
  // Hash da senha antes de armazenar
  const hashedPassword = await hashPassword(user.password);
  
  // Converter active de booleano para número (0 ou 1)
  const isActive = user.active !== undefined ? (user.active ? 1 : 0) : 0;
  
  const db = await getDatabase();
  const stmt = db.prepare(
    'INSERT INTO users (name, email, password, role, permissions, active) VALUES (?, ?, ?, ?, ?, ?)'
  );
  
  return stmt.run(
    user.name,
    user.email,
    hashedPassword,
    user.role || 'user',
    JSON.stringify(user.permissions || []),
    isActive
  );
};

export const getUserByEmail = async (email: string): Promise<UserWithParsedPermissions | null> => {
  try {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email) as User | undefined;
    
    if (user) {
      try {
        return {
          ...user,
          permissions: JSON.parse(user.permissions || '[]')
        };
      } catch (parseError) {
        return {
          ...user,
          permissions: []
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<UserWithParsedPermissions[]> => {
  const db = await getDatabase();
  const stmt = db.prepare('SELECT * FROM users');
  const users = stmt.all() as User[];
  return users.map(user => ({
    ...user,
    permissions: JSON.parse(user.permissions || '[]')
  }));
};

export const updateUser = async (id: number, updates: Partial<{
  name: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
  active: boolean;
}>) => {
  console.log('updateUser chamado com ID:', id, 'Tipo:', typeof id);
  console.log('Updates recebidos:', updates);
  console.log('Campo active recebido:', updates.active, 'Tipo:', typeof updates.active);
  
  const db = await getDatabase();
  
  try {
    // Se a senha estiver sendo atualizada, aplicar hash
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }

    // Tratamento especial para o campo active
    if ('active' in updates) {
      // Garantir que o valor seja um booleano explícito
      const activeValue = updates.active;
      const boolActive = activeValue === true || 
                         (typeof activeValue === 'string' && activeValue === 'true') || 
                         (typeof activeValue === 'number' && activeValue === 1);
      const isActive = boolActive ? 1 : 0;
      console.log(`Campo 'active' será definido para: ${isActive} (valor original: ${updates.active})`);
      
      // Atualizar diretamente o campo active para garantir que seja persistido
      try {
        const activeUpdateQuery = `UPDATE users SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        const activeStmt = db.prepare(activeUpdateQuery);
        const activeResult = activeStmt.run(isActive, id);
        console.log(`Resultado da atualização do campo 'active':`, activeResult);
      } catch (activeErr) {
        console.error('Erro ao atualizar campo active:', activeErr);
      }
    }

    // Abordagem alternativa: construir consultas separadas para cada campo
    // Para evitar problemas com a passagem de parâmetros
    let affectedRows = 0;
    
    // Verificar se a coluna 'active' existe e criar se não existir
    try {
      console.log('Verificando se a coluna \'active\' existe na tabela \'users\'...');
      const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
      const activeColumnExists = tableInfo.some(col => col.name === 'active');
      console.log('Coluna \'active\' já existe na tabela \'users\'.', activeColumnExists);
      
      // Se a coluna não existir, criar
      if (!activeColumnExists) {
        console.log('Criando a coluna \'active\' na tabela \'users\'...');
        const alterSql = "ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 0";
        db.prepare(alterSql).run();
        console.log('Coluna \'active\' criada com sucesso.');
      }
    } catch (err) {
      console.warn('Erro ao verificar/criar coluna active:', err);
      // Tentar criar a coluna de qualquer forma
      try {
        const alterSql = "ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 0";
        db.prepare(alterSql).run();
      } catch (innerErr) {
        console.warn('Erro ao criar coluna active após falha na verificação:', innerErr);
      }
    }
    
    // Processar cada campo individualmente (exceto 'active' que já foi tratado)
    for (const [key, value] of Object.entries(updates)) {
      // Pular o campo 'active' já que foi tratado separadamente
      if (key === 'active') continue;
      
      let finalValue: string | number | null = null;
      
      // Converter permissões para JSON string
      if (key === 'permissions' && Array.isArray(value)) {
        finalValue = JSON.stringify(value);
      } else {
        // Para outros campos, usar o valor como está
        finalValue = value as string | number | null;
      }
      
      // Criar e executar a consulta para este campo específico
      const updateQuery = `UPDATE users SET ${key} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      console.log(`Atualizando campo "${key}" para`, finalValue);
      
      const stmt = db.prepare(updateQuery);
      const result = stmt.run(finalValue, id);
      
      console.log(`Resultado da atualização para campo "${key}":`, result);
      
      if (result && result.changes) {
        affectedRows += result.changes;
      }
    }
    
    // Verificar se a atualização do campo 'active' foi bem-sucedida
    if ('active' in updates) {
      try {
        const activeValue = updates.active;
        const boolActive = activeValue === true || 
                         (typeof activeValue === 'string' && activeValue === 'true') || 
                         (typeof activeValue === 'number' && activeValue === 1);
        const expectedValue = boolActive ? 1 : 0;
        
        const checkQuery = `SELECT active FROM users WHERE id = ?`;
        const checkStmt = db.prepare(checkQuery);
        const user = checkStmt.get(id) as any;
        console.log(`Verificação após atualização: valor 'active' atual = ${user?.active} (esperado: ${expectedValue})`);
        
        // Se o valor não foi atualizado corretamente, tentar novamente com um método alternativo
        if (user && user.active !== expectedValue) {
          console.log(`Valor 'active' não foi atualizado corretamente. Tentando novamente com abordagem alternativa.`);
          
          const directQuery = `UPDATE users SET active = ${expectedValue} WHERE id = ${id}`;
          db.exec(directQuery);
          
          const checkAgain = checkStmt.get(id) as any;
          console.log(`Nova verificação: valor 'active' atual = ${checkAgain?.active}`);
        }
      } catch (checkErr) {
        console.error('Erro ao verificar campo active após atualização:', checkErr);
      }
    }
    
    console.log('Total de linhas afetadas:', affectedRows);
    return { changes: affectedRows > 0 || 'active' in updates ? 1 : 0 };
  } catch (err) {
    console.error('Erro ao executar SQL de atualização:', err);
    throw err;
  }
};

export const deleteUser = async (id: number) => {
  const db = await getDatabase();
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  return stmt.run(id);
};

// Helper functions for patients
export const createPatient = async (patient: {
  name: string;
  cpf?: string;
  birth_date?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  education?: string;
  family_income?: string;
  notes?: string;
  appointment_date?: string;
  appointment_time?: string;
  appointment_location?: string;
  service_date?: string;
}) => {
  const db = await getDatabase();
  const fields = Object.keys(patient).join(', ');
  const placeholders = Object.keys(patient).map(() => '?').join(', ');
  const values = Object.values(patient);

  const stmt = db.prepare(`
    INSERT INTO patients (${fields}) 
    VALUES (${placeholders})
  `);
  
  // Converter para array de parâmetros individuais
  return stmt.run(...values);
};

export const getPatientByCPF = async (cpf: string) => {
  const db = await getDatabase();
  const stmt = db.prepare('SELECT * FROM patients WHERE cpf = ?');
  return stmt.get(cpf);
};

export const getAllPatients = async () => {
  const db = await getDatabase();
  const stmt = db.prepare('SELECT * FROM patients');
  return stmt.all();
};

export const updatePatient = async (id: number, updates: Partial<{
  name: string;
  cpf: string;
  birth_date: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  education: string;
  family_income: string;
  notes: string;
  appointment_date: string;
  appointment_time: string;
  appointment_location: string;
  service_date: string;
}>) => {
  const db = await getDatabase();
  const fields = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ');
  const values = Object.values(updates);
  
  const stmt = db.prepare(`
    UPDATE patients 
    SET ${fields}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  
  // Converter para array de parâmetros individuais
  const params = [...values, id];
  return stmt.run(...params);
};

export const deletePatient = async (id: number) => {
  const db = await getDatabase();
  const stmt = db.prepare('DELETE FROM patients WHERE id = ?');
  return stmt.run(id);
};

// Functions para registrar e obter atividades de usuários
export const logUserActivity = async (activity: {
  user_id: number | null;
  action_type: UserActivity['action_type'];
  target_type: UserActivity['target_type'];
  target_id?: number;
  details: string;
  ip_address?: string;
}) => {
  try {
    const db = await getDatabase();
    const stmt = db.prepare(`
      INSERT INTO user_activities 
      (user_id, action_type, target_type, target_id, details, ip_address) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      activity.user_id,
      activity.action_type,
      activity.target_type,
      activity.target_id || null,
      activity.details,
      activity.ip_address || null
    );
  } catch (error) {
    console.error('Erro ao registrar atividade do usuário:', error);
    // Não propagar o erro para não interromper a operação principal
    return { changes: 0 };
  }
};

export const getUserActivities = async (limit = 100, offset = 0): Promise<UserActivity[]> => {
  try {
    const db = await getDatabase();
    const stmt = db.prepare(`
      SELECT 
        a.*, 
        u.name as user_name
      FROM 
        user_activities a
      LEFT JOIN 
        users u ON a.user_id = u.id
      ORDER BY 
        a.timestamp DESC
      LIMIT ? OFFSET ?
    `);
    
    return stmt.all(limit, offset) as UserActivity[];
  } catch (error) {
    console.error('Erro ao obter atividades de usuários:', error);
    return [];
  }
};

export const getUserActivitiesByUserId = async (userId: number, limit = 50): Promise<UserActivity[]> => {
  try {
    const db = await getDatabase();
    const stmt = db.prepare(`
      SELECT 
        a.*, 
        u.name as user_name
      FROM 
        user_activities a
      LEFT JOIN 
        users u ON a.user_id = u.id
      WHERE 
        a.user_id = ?
      ORDER BY 
        a.timestamp DESC
      LIMIT ?
    `);
    
    return stmt.all(userId, limit) as UserActivity[];
  } catch (error) {
    console.error('Erro ao obter atividades do usuário:', error);
    return [];
  }
};