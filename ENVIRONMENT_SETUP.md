# 🌍 Configuração de Variáveis de Ambiente

## 📋 Resumo dos Arquivos Encontrados

### Status Atual:
- ✅ **`.env`** - 3 variáveis (funcionando)
- ⚠️ **`.env.local`** - 15+ variáveis (CORROMPIDO - precisa ser refeito)
- ❌ **`.env.local.example`** - vazio

### 📚 Como o Next.js Carrega as Variáveis

**Ordem de precedência (sistema "first wins"):**
1. `process.env` (variáveis do sistema)
2. `.env.development.local` (ambiente específico + local)
3. `.env.local` (não carregado em testes)
4. `.env.development` (ambiente específico)
5. `.env` (geral)

## 🔧 Variáveis Necessárias para a Aplicação

### 🛠️ Sistema
```bash
NODE_ENV=development
PORT=3006
NEXT_PUBLIC_API_URL=http://localhost:3006
DISABLE_CONSOLE_LOGS=false
```

### 📊 Google Sheets - Principal
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=bancodedadosacoes@aplicacoesacoesbanco.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_ID=1AHOem5yg6wPWwOiCZRaZRsvwZPwsfbKs_xbb6SWtG-E
GOOGLE_CLIENT_EMAIL=bancodedadosacoes@aplicacoesacoesbanco.iam.gserviceaccount.com
```

### 🏗️ Obras e Demandas
```bash
OBRAS_SHEET_ID=sua_planilha_obras_id
OBRAS_SHEET_NAME="Cadastro de demandas"
OBRAS_SHEET_CLIENT_EMAIL=sua_conta_obras@projeto.iam.gserviceaccount.com
OBRAS_SHEET_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nCHAVE_OBRAS\n-----END PRIVATE KEY-----"
OBRAS_SHEET_PROJECT_ID=seu_projeto_obras_id
```

### 📈 Projeção 2026
```bash
PROJECAO_SHEET_ID=sua_planilha_projecao_id
PROJECAO_SHEET_NAME="VOTAÇÃO FINAL"
PROJECAO_SHEET_COLUMNS="A,C,E,I,Q"
PROJECAO_CLIENT_EMAIL=sua_conta_projecao@projeto.iam.gserviceaccount.com
```

### 💰 Emendas 2025
```bash
EMENDAS_SHEETS_CLIENT_EMAIL=sua_conta_emendas@projeto.iam.gserviceaccount.com
EMENDAS_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nCHAVE_EMENDAS\n-----END PRIVATE KEY-----"
EMENDAS_SHEET_ID=sua_planilha_emendas_id
EMENDAS_SHEET_NAME="Atualizado2025"
```

### 🗳️ Eleições Anteriores
```bash
GOOGLE_SHEETS_CLIENT_EMAIL=sua_conta_eleicoes@projeto.iam.gserviceaccount.com
GOOGLE_SHEETS_SPREADSHEET_ID=sua_planilha_eleicoes_id
```

## 🚀 Configuração para Deploy no Vercel

### Passos para Deploy:

1. **Limpe o arquivo `.env.local` corrompido**
2. **Configure as variáveis no Vercel:**
   - Acesse: Project Settings > Environment Variables
   - Adicione todas as variáveis acima
   - Para production, altere `NEXT_PUBLIC_API_URL` para sua URL do Vercel

3. **⚠️ Cuidados Importantes:**
   - **NUNCA** commite arquivos `.env.local` no Git
   - Private keys devem usar `\n` para quebras de linha
   - Variáveis `NEXT_PUBLIC_*` são expostas ao browser
   - Teste localmente antes do deploy

### 📝 Template Limpo para .env.local

Crie um novo arquivo `.env.local` com este conteúdo (substituindo pelos valores reais):

```bash
# Sistema
NODE_ENV=development
PORT=3006
NEXT_PUBLIC_API_URL=http://localhost:3006

# Google Sheets Principal
GOOGLE_SERVICE_ACCOUNT_EMAIL=bancodedadosacoes@aplicacoesacoesbanco.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDSDLfQ...\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_ID=1AHOem5yg6wPWwOiCZRaZRsvwZPwsfbKs_xbb6SWtG-E
GOOGLE_CLIENT_EMAIL=bancodedadosacoes@aplicacoesacoesbanco.iam.gserviceaccount.com

# Obras (substitua pelos valores corretos)
OBRAS_SHEET_ID=1lYB7Uk3MEGgOLIwU1auUAlXLv_LfumfYg4FMPJFbBkI
OBRAS_SHEET_NAME="Cadastro de demandas"
OBRAS_SHEET_CLIENT_EMAIL=potalaplicacoesobras@portalaplicacoesobras.iam.gserviceaccount.com
OBRAS_SHEET_PRIVATE_KEY="SUA_CHAVE_OBRAS_AQUI"
OBRAS_SHEET_PROJECT_ID=portalaplicacoesobras

# Adicione as demais conforme necessário...
```

## 🔍 Diagnóstico Atual

### Problemas Identificados:
1. **`.env.local` corrompido** - arquivo ilegível com encoding errado
2. **Duplicação de variáveis** - mesma variável em múltiplos arquivos
3. **Private keys quebradas** - formatação incorreta
4. **Encoding UTF-8** - caracteres especiais corrompidos

### ✅ Solução Recomendada:
1. Recriar `.env.local` do zero usando o template acima
2. Copiar valores funcionais do `.env` 
3. Organizar todas as variáveis em uma estrutura limpa
4. Testar localmente antes do deploy no Vercel 