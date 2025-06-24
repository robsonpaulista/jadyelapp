# Importação de Emendas para Firebase

## Resumo
Este documento descreve a implementação realizada para importar dados da planilha `emendas.xlsx` para uma coleção no Firebase e exibir esses dados na página `emendas2025`.

## ✅ O que foi implementado

### 1. Conversão da Planilha
- **Script**: `scripts/convertEmendasToJson.py`
- **Função**: Converte a planilha Excel `emendas.xlsx` para JSON
- **Resultado**: Arquivo `emendas.json` com 85 registros

### 2. Importação para Firebase
- **Script**: `scripts/importDirectToFirebase.js`
- **Função**: Importa os dados JSON diretamente para o Firebase
- **Coleção**: `emendas` (criada automaticamente)
- **Status**: ✅ 85 registros importados com sucesso

### 3. API para Consulta
- **Arquivo**: `src/app/api/emendas/route.ts`
- **Endpoint**: `GET /api/emendas`
- **Funcionalidades**:
  - Busca todos os registros da coleção
  - Filtros por município e bloco
  - Ordenação por valor indicado
  - Limite de resultados

### 4. API para Importação
- **Arquivo**: `src/app/api/emendas/import/route.ts`
- **Endpoint**: `POST /api/emendas/import`
- **Função**: Endpoint alternativo para importação via API

### 5. Página Atualizada
- **Arquivo**: `src/app/(internas)/emendas2025/page.tsx`
- **Funcionalidades**:
  - Carrega dados do Firebase (não mais do Google Sheets)
  - Sistema de filtros avançado (texto, bloco, município)
  - Agrupamento por blocos expansíveis
  - Resumo com totais e estatísticas
  - Interface moderna com shadcn/ui

## 📊 Estrutura dos Dados

### Campos da Coleção Firebase `emendas`:
```typescript
interface Emenda {
  id: string;                          // ID automático do Firebase
  bloco: string | null;                // Ex: "BLOCO 1", "BLOCO 2"
  emenda: string | null;               // Ex: "Impessoal RP2"
  municipioBeneficiario: string | null; // Ex: "PICOS", "PARNAÍBA"
  funcional: string | null;            // Classificação funcional
  gnd: string | null;                  // Grupo de Natureza de Despesa
  valorIndicado: number | null;        // Valor em reais
  objeto: string | null;               // Descrição do objeto
  alteracao: string | null;            // Alterações
  numeroProposta: string | null;       // Número da proposta
  valorEmpenhado: number | null;       // Valor empenhado
  empenho: string | null;              // Número do empenho
  dataEmpenho: string | null;          // Data do empenho
  portariaConvenioContrato: string | null; // Documentos relacionados
  valorAEmpenhar: number | null;       // Valor a ser empenhado
  pagamento: string | null;            // Informações de pagamento
  valorPago: number | null;            // Valor já pago
  valorASerPago: number | null;        // Valor ainda a ser pago
  liderancas: string | null;           // Lideranças responsáveis
  createdAt: Date;                     // Data de criação
  updatedAt: Date;                     // Data de atualização
}
```

## 🔥 Acesso ao Firebase

### Variáveis de Ambiente (`.env.local`):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🌐 Endpoints da API

### GET /api/emendas
Retorna todas as emendas da coleção Firebase.

**Parâmetros opcionais:**
- `limit`: Limita o número de resultados (max: 1000)
- `municipio`: Filtra por município específico
- `bloco`: Filtra por bloco específico

**Exemplo:**
```
GET /api/emendas?limit=10&bloco=BLOCO%201&municipio=PICOS
```

**Resposta:**
```json
{
  "success": true,
  "count": 85,
  "emendas": [...]
}
```

### POST /api/emendas/import
Importa dados do arquivo `emendas.json` para o Firebase.

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "85 emendas importadas com sucesso para o Firebase",
  "imported": 85,
  "total": 85
}
```

## 📱 Recursos da Página emendas2025

### 1. Resumo Geral
- Total de emendas
- Valor total indicado
- Valor total a empenhar
- Número de municípios atendidos

### 2. Sistema de Filtros
- **Busca textual**: Pesquisa em emenda, município, lideranças e objeto
- **Filtro por bloco**: Dropdown com todos os blocos disponíveis
- **Filtro por município**: Dropdown com todos os municípios

### 3. Visualização por Blocos
- Agrupamento automático por blocos
- Expansão/recolhimento individual ou em lote
- Totais por bloco (valor indicado, a empenhar, municípios)
- Tabela detalhada com todos os campos relevantes

### 4. Funcionalidades
- Botão de atualização de dados
- Limpeza de filtros
- Design responsivo
- Loading states
- Tratamento de erros

## 🚀 Status Final

✅ **Concluído com Sucesso**
- 85 registros importados para Firebase
- Coleção `emendas` criada e populada
- APIs funcionando (testado na porta 3006)
- Página emendas2025 totalmente funcional
- Sistema de filtros implementado
- Interface moderna e responsiva

## 🧹 Limpeza

Para remover arquivos temporários criados durante o processo:
```bash
node scripts/cleanupTempFiles.js
```

Este script remove:
- `emendas.json`
- Scripts temporários de importação
- Arquivos de verificação

## 📝 Próximos Passos Recomendados

1. **Backup**: Configure backup automático da coleção Firebase
2. **Índices**: Crie índices no Firebase para otimizar consultas
3. **Validação**: Implemente validação de dados na API
4. **Auditoria**: Adicione logs de auditoria para alterações
5. **Exportação**: Crie funcionalidade para exportar dados filtrados 