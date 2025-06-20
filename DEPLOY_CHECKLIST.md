# ✅ Checklist de Deploy para Vercel

## 🔍 Status Atual da Aplicação

### ✅ **PRONTOS PARA DEPLOY**

#### 🛠️ **Correções Realizadas**
- [x] Erros de tipagem TypeScript corrigidos
- [x] URLs hardcoded substituídas por variáveis de ambiente  
- [x] Configurações de desenvolvimento removidas do `next.config.js`
- [x] Console.logs de produção configurados (removidos exceto errors)
- [x] Arquivo `.gitignore` criado para proteger arquivos sensíveis
- [x] Variáveis de ambiente organizadas e documentadas

#### 📂 **Arquivos de Configuração**
- [x] `next.config.js` - otimizado para produção
- [x] `package.json` - scripts de build configurados
- [x] `.gitignore` - protegendo arquivos sensíveis
- [x] `ENVIRONMENT_SETUP.md` - guia completo das variáveis

## ⚠️ **AÇÕES NECESSÁRIAS ANTES DO DEPLOY**

### 1. **🔧 Recriar arquivo `.env.local`**
```bash
# O arquivo atual está corrompido - use o template em ENVIRONMENT_SETUP.md
# Substitua pelos valores reais:

NODE_ENV=production
NEXT_PUBLIC_API_URL=https://seu-projeto.vercel.app

# Google Sheets - Principal
GOOGLE_SERVICE_ACCOUNT_EMAIL=bancodedadosacoes@aplicacoesacoesbanco.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_COMPLETA\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_ID=1AHOem5yg6wPWwOiCZRaZRsvwZPwsfbKs_xbb6SWtG-E

# Adicione todas as outras variáveis conforme documentação
```

### 2. **🚀 Configurar no Vercel**
1. Fazer push do código para GitHub
2. Conectar repositório no Vercel
3. Em **Project Settings > Environment Variables**, adicionar TODAS as variáveis
4. **IMPORTANTE**: `NEXT_PUBLIC_API_URL` deve apontar para sua URL do Vercel

### 3. **🔒 Segurança**
- [x] Arquivos `.env.local` no `.gitignore` 
- [x] Private keys não expostas no código
- [x] Console.logs sensíveis removidos
- [x] URLs de desenvolvimento removidas

## 🏗️ **Variáveis de Ambiente Necessárias no Vercel**

### **📋 Lista Completa (25+ variáveis)**

#### Sistema
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://seu-projeto.vercel.app
DISABLE_CONSOLE_LOGS=true
```

#### Google Sheets Principal
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=bancodedadosacoes@aplicacoesacoesbanco.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_ID=1AHOem5yg6wPWwOiCZRaZRsvwZPwsfbKs_xbb6SWtG-E
GOOGLE_CLIENT_EMAIL=bancodedadosacoes@aplicacoesacoesbanco.iam.gserviceaccount.com
```

#### Obras e Demandas
```
OBRAS_SHEET_ID=1lYB7Uk3MEGgOLIwU1auUAlXLv_LfumfYg4FMPJFbBkI
OBRAS_SHEET_NAME="Cadastro de demandas"
OBRAS_SHEET_CLIENT_EMAIL=potalaplicacoesobras@portalaplicacoesobras.iam.gserviceaccount.com
OBRAS_SHEET_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nCHAVE_OBRAS\n-----END PRIVATE KEY-----"
OBRAS_SHEET_PROJECT_ID=portalaplicacoesobras
```

#### Projeção 2026
```
PROJECAO_SHEET_ID=sua_planilha_projecao_id
PROJECAO_SHEET_NAME="VOTAÇÃO FINAL"
PROJECAO_SHEET_COLUMNS="A,C,E,I,Q"
PROJECAO_CLIENT_EMAIL=sua_conta_projecao@projeto.iam.gserviceaccount.com
```

#### Emendas 2025
```
EMENDAS_SHEETS_CLIENT_EMAIL=sua_conta_emendas@projeto.iam.gserviceaccount.com
EMENDAS_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nCHAVE_EMENDAS\n-----END PRIVATE KEY-----"
EMENDAS_SHEET_ID=sua_planilha_emendas_id
EMENDAS_SHEET_NAME="Atualizado2025"
```

#### Eleições Anteriores
```
GOOGLE_SHEETS_CLIENT_EMAIL=sua_conta_eleicoes@projeto.iam.gserviceaccount.com
GOOGLE_SHEETS_SPREADSHEET_ID=sua_planilha_eleicoes_id
```

## 🧪 **Teste Final**

### **Antes do Deploy:**
```bash
# 1. Teste local
npm run build
npm run start

# 2. Verifique se não há erros de console
# 3. Teste as principais funcionalidades
# 4. Verifique se todas as APIs respondem
```

### **Após Deploy:**
- [ ] Testar login/logout
- [ ] Verificar dashboard principal
- [ ] Testar integração com Google Sheets
- [ ] Verificar se os dados carregam corretamente
- [ ] Testar responsividade

## 🎯 **Funcionalidades Principais da Aplicação**

### **✅ Módulos Funcionais**
- 🏠 **Dashboard** - painel principal com estatísticas
- 👥 **Base Lideranças** - gestão de lideranças políticas
- 🏗️ **Obras & Demandas** - acompanhamento de obras públicas
- 💰 **Emendas 2025** - gestão de emendas parlamentares
- 📊 **Projeção 2026** - análise eleitoral
- 🗳️ **Eleições Anteriores** - histórico eleitoral
- 👤 **Gestão de Usuários** - administração de acessos
- 📰 **Monitoramento de Notícias** - feed de notícias
- 📱 **Instagram Analytics** - análise de redes sociais

### **🔧 Tecnologias**
- ⚡ **Next.js 14** - Framework principal
- 🎨 **Tailwind CSS** - Estilização
- 📊 **Chart.js** - Gráficos e visualizações
- 🗃️ **SQLite** - Banco de dados local
- 📈 **Google Sheets API** - Integração com planilhas
- 🔐 **Autenticação** - Sistema próprio com cookies

## 🚀 **Comando Final**

```bash
# Após configurar todas as variáveis no Vercel:
git add .
git commit -m "feat: preparado para deploy no Vercel"
git push origin main

# No Vercel: Deploy automático será iniciado
```

---

## 📞 **Suporte**

Se houver problemas no deploy:
1. Verifique os logs do Vercel
2. Confirme se todas as variáveis de ambiente estão configuradas
3. Teste localmente com `npm run build` antes de fazer push 