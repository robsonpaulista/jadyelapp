import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

let _db: Database.Database | null = null;

// Função para inicializar o banco de dados
const initializeDatabase = async () => {
  if (_db) return _db;

  try {
    // Inicializa o banco de dados
    const dbPath = path.join(process.cwd(), 'data.db');
    _db = new Database(dbPath);

    // Create tables if they don't exist
    _db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        permissions TEXT DEFAULT '[]',
        active BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cpf TEXT UNIQUE,
        birth_date TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        education TEXT,
        family_income TEXT,
        notes TEXT,
        appointment_date TEXT,
        appointment_time TEXT,
        appointment_location TEXT,
        service_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS user_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action_type TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id INTEGER,
        details TEXT,
        ip_address TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS emendassuas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        municipio TEXT NOT NULL,
        tipo_proposta TEXT NOT NULL,
        tipo_recurso TEXT NOT NULL,
        valor_proposta REAL NOT NULL,
        valor_pagar REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Executar migração para verificar e adicionar a coluna active se não existir
    try {
      console.log("Verificando se a coluna 'active' existe na tabela 'users'...");
      
      // Verificar se a coluna 'active' existe
      const tableInfo = _db.prepare("PRAGMA table_info(users)").all();
      const activeColumnExists = tableInfo.some((col: any) => col.name === 'active');
      
      if (!activeColumnExists) {
        console.log("Coluna 'active' não encontrada. Adicionando coluna 'active' à tabela 'users'...");
        
        // Adicionar a coluna 'active' com valor padrão 0 (FALSE)
        _db.exec("ALTER TABLE users ADD COLUMN active BOOLEAN DEFAULT 0");
        
        console.log("Coluna 'active' adicionada com sucesso!");
        
        // Atualizar usuários existentes para active=1 por segurança
        const updateResult = _db.prepare("UPDATE users SET active = 1").run();
        console.log(`${updateResult.changes} usuários existentes atualizados para active=1`);
      } else {
        console.log("Coluna 'active' já existe na tabela 'users'.");
      }
    } catch (migrationError) {
      console.error("Erro durante a migração da tabela 'users':", migrationError);
      // Continuar mesmo com erro na migração
    }

    // Verificar se existem usuários
    const userCount = _db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    
    // Se não existir nenhum usuário, criar um usuário administrador padrão
    if (userCount.count === 0) {
      console.log('Nenhum usuário encontrado. Criando administrador padrão...');
      
      // Gerar hash da senha padrão
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync('admin123', salt);
      
      const defaultAdmin = {
        name: 'Administrador',
        email: 'admin@exemplo.com',
        password: hashedPassword,
        role: 'admin',
        permissions: JSON.stringify([
          'painel-aplicacoes',
          'gerenciar-usuarios',
          'baseliderancas',
          'emendas2025',
          'projecao2026',
          'instagram-analytics',
          'acoes',
          'obras_demandas',
          'cadastro',
          'pacientes',
          'configuracoes'
        ])
      };
      
      const stmt = _db.prepare(`
        INSERT INTO users (name, email, password, role, permissions, active)
        VALUES (?, ?, ?, ?, ?, 1)
      `);
      
      stmt.run(
        defaultAdmin.name,
        defaultAdmin.email,
        defaultAdmin.password,
        defaultAdmin.role,
        defaultAdmin.permissions
      );
      
      console.log('Administrador padrão criado com sucesso!');
      console.log('Email: admin@exemplo.com');
      console.log('Senha: admin123');
    }

    return _db;
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
};

// Exporta uma função que retorna a instância do banco de dados
export const getDatabase = async () => {
  if (!_db) {
    return await initializeDatabase();
  }
  return _db;
}; 