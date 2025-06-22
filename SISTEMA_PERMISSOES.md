# Sistema de Permissões - Mutirão Catarata

## Visão Geral

O sistema de permissões foi implementado para controlar o acesso de usuários baseado em níveis de permissão armazenados no Firestore. Cada usuário possui um campo `level` que determina quais páginas e funcionalidades ele pode acessar.

## Níveis de Usuário

### Admin (`admin`)
- **Acesso**: Completo a todas as funcionalidades
- **Páginas**: Todas as páginas do sistema
- **Menus**: Todos os menus visíveis
- **Funcionalidades especiais**: Gerenciamento de usuários, configurações do sistema

### Usuário (`user`)
- **Acesso**: Limitado, sem acesso ao menu de Municípios
- **Páginas permitidas**:
  - Página inicial (`/`)
  - Painel de aplicações (`/painel-aplicacoes`)
  - Leads (`/acoes`, `/monitoramento-noticias`, `/instagram-analytics`)
  - Eleições (`/projecao2026`, `/chapas`, `/pesquisas-eleitorais`, `/eleicoes-anteriores`)
  - Pessoas e pacientes (`/pessoas`, `/pacientes`)
- **Menus visíveis**: Leads, Eleições
- **Menus ocultos**: Municípios, Configurações

### Gabinete Emendas (`gabineteemendas`)
- **Acesso**: Muito restrito, apenas consulta de tetos
- **Páginas permitidas**:
  - Página inicial (`/`)
  - Painel de aplicações (`/painel-aplicacoes`)
  - Consultar Tetos (`/consultar-tetos`)
- **Menus visíveis**: Nenhum menu principal
- **Redirecionamento**: Automaticamente direcionado para `/consultar-tetos`

### Gabinete Jurídico (`gabinetejuridico`)
- **Acesso**: Restrito à área jurídica
- **Páginas permitidas**:
  - Página inicial (`/`)
  - Painel de aplicações (`/painel-aplicacoes`)
  - Projetos (`/projetos`)
- **Menus visíveis**: Nenhum menu principal
- **Redirecionamento**: Automaticamente direcionado para `/projetos`

## Implementação Técnica

### Arquivos Principais

1. **`src/lib/permissions.ts`**: Define as permissões e funções de validação
2. **`src/hooks/usePermissions.ts`**: Hook para gerenciar permissões no frontend
3. **`src/components/auth/RouteGuard.tsx`**: Componentes de proteção de rotas
4. **`src/components/Navbar.tsx`**: Menu adaptado com base nas permissões

### Estrutura de Dados

```typescript
export type UserLevel = 'admin' | 'user' | 'gabineteemendas' | 'gabinetejuridico';

export interface UserPermissions {
  level: UserLevel;
  routes: string[];
  menuAccess: {
    leads: boolean;
    municipios: boolean;
    eleicoes: boolean;
    configuracoes: boolean;
  };
}
```

### Fluxo de Autenticação e Permissões

1. **Login**: Usuário faz login e dados são armazenados no localStorage
2. **Verificação**: Hook `usePermissions` verifica o nível do usuário
3. **Proteção de Rotas**: `RouteGuard` valida acesso a cada página
4. **Interface**: Menu e componentes se adaptam às permissões
5. **Redirecionamento**: Usuários sem permissão são redirecionados automaticamente

### Componentes de Proteção

#### RouteGuard
```tsx
<RouteGuard>
  {children}
</RouteGuard>
```
- Protege páginas baseado no nível do usuário
- Redireciona automaticamente se sem permissão

#### AdminRouteGuard
```tsx
<AdminRouteGuard>
  {children}
</AdminRouteGuard>
```
- Proteção específica para páginas administrativas
- Apenas usuários `admin` têm acesso

## Configuração de Usuário

### Campo Level no Firestore
Para que o sistema funcione, cada usuário deve ter o campo `level` definido:

```javascript
// Exemplo de usuário no Firestore
{
  id: "user123",
  name: "João Silva",
  email: "joao@example.com",
  level: "gabineteemendas", // Campo obrigatório
  active: true,
  createdAt: "2025-01-21T19:44:59.245Z"
}
```

### Atualização de Usuários Existentes
Para usuários existentes sem o campo `level`, adicione via console Firebase:

```javascript
// No console do Firebase
db.collection('users').doc('USER_ID').update({
  level: 'user' // ou o nível apropriado
});
```

## Casos de Uso

### Cenário 1: Usuário Gabinete Emendas
1. Faz login no sistema
2. É automaticamente redirecionado para `/consultar-tetos`
3. Vê apenas o avatar e botões de voltar/sair no menu
4. Não consegue acessar outras páginas (é redirecionado se tentar)

### Cenário 2: Usuário Normal
1. Faz login no sistema
2. Acessa `/painel-aplicacoes` normalmente
3. Vê menus de Leads e Eleições
4. Menu de Municípios fica oculto
5. Não consegue acessar `/gerenciar-usuarios`

### Cenário 3: Administrador
1. Faz login no sistema
2. Tem acesso completo a todas as funcionalidades
3. Vê todos os menus disponíveis
4. Pode gerenciar usuários e configurações

## Debugging e Logs

### Console Logs
O sistema registra tentativas de acesso não autorizado:
```
Usuário João Silva (gabineteemendas) tentou acessar /obras_demandas sem permissão
```

### Verificação de Permissões
Para verificar as permissões de um usuário no console:
```javascript
// No console do navegador
const user = JSON.parse(localStorage.getItem('user'));
console.log('Nível do usuário:', user.level);
```

## Extensibilidade

### Adicionando Novo Nível
1. Adicione o tipo em `src/lib/permissions.ts`:
```typescript
export type UserLevel = 'admin' | 'user' | 'gabineteemendas' | 'gabinetejuridico' | 'novoNivel';
```

2. Defina as permissões:
```typescript
export const ROUTE_PERMISSIONS: Record<UserLevel, string[]> = {
  // ... outros níveis
  novoNivel: [
    '/',
    '/painel-aplicacoes',
    '/nova-pagina'
  ]
};
```

3. Atualize as permissões de menu:
```typescript
export const MENU_PERMISSIONS: Record<UserLevel, UserPermissions['menuAccess']> = {
  // ... outros níveis
  novoNivel: {
    leads: false,
    municipios: true,
    eleicoes: false,
    configuracoes: false
  }
};
```

### Adicionando Nova Rota Protegida
1. Adicione a rota nas permissões apropriadas em `ROUTE_PERMISSIONS`
2. Se necessário, adicione verificação específica na página
3. Teste com diferentes níveis de usuário

## Manutenção

### Monitoramento
- Logs de acesso negado aparecem no console
- Usuários são redirecionados automaticamente
- Sistema é tolerante a falhas (fallback para página inicial)

### Atualizações
- Permissões podem ser atualizadas em tempo real modificando `src/lib/permissions.ts`
- Não requer alteração de banco de dados para mudanças de permissão
- Cache do navegador pode precisar ser limpo após grandes mudanças

## Considerações de Segurança

1. **Validação Frontend**: Implementada para UX, mas não é segurança real
2. **Validação Backend**: APIs devem validar permissões independentemente
3. **Tokens**: Sistema depende de localStorage (considerar JWT no futuro)
4. **Logs**: Evitar logs excessivos com dados sensíveis

## Troubleshooting

### Problema: Usuário não consegue acessar nenhuma página
**Solução**: Verificar se o campo `level` existe no Firestore

### Problema: Menu não aparece corretamente
**Solução**: Limpar localStorage e fazer login novamente

### Problema: Redirecionamento infinito
**Solução**: Verificar se o usuário tem permissão para a página de destino padrão

### Problema: Permissões não atualizam
**Solução**: Atualizar o hook `usePermissions` ou limpar cache do navegador 