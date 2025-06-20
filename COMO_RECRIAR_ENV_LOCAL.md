# 🔧 Como Recriar o Arquivo .env.local Corrompido

## 🚨 **PROBLEMA IDENTIFICADO**

O arquivo `.env.local` estava **corrompido** com:
- ❌ Encoding UTF-8 inválido
- ❌ Private keys cortadas/incompletas  
- ❌ Formatação quebrada
- ❌ Variáveis duplicadas

## 📋 **SOLUÇÃO PASSO A PASSO**

### **Passo 1: Backup e Limpeza**
```bash
# Se o arquivo .env.local existir, faça backup primeiro
copy .env.local .env.local.backup

# Remova o arquivo corrompido
del .env.local
```

### **Passo 2: Usar o Template Limpo**
Copie o arquivo `env.local.template` que criamos:
```bash
copy env.local.template .env.local
```

### **Passo 3: Substituir os Valores Reais**

**⚠️ CRÍTICO:** Substitua **TODOS** os valores `SUA_CHAVE_AQUI` pelos valores reais!

#### **🔑 Private Keys - Formato Correto:**
```bash
# ❌ FORMATO ERRADO (quebrado):
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0...
-----END PRIVATE KEY-----

# ✅ FORMATO CORRETO (uma linha com \n):
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDSDLfQ...\n-----END PRIVATE KEY-----"
```

#### **📋 Valores que você precisa preencher:**

**🛠️ Sistema (já preenchidos):**
- ✅ `NODE_ENV=development`
- ✅ `PORT=3006`  
- ✅ `NEXT_PUBLIC_API_URL=http://localhost:3006`

**📊 Google Sheets Principal:**
- ✅ `GOOGLE_SERVICE_ACCOUNT_EMAIL` (já preenchido)
- ⚠️ `GOOGLE_PRIVATE_KEY` → **SUBSTITUIR pela chave real**
- ✅ `GOOGLE_SHEET_ID` (já preenchido)
- ✅ `GOOGLE_CLIENT_EMAIL` (já preenchido)

**🏗️ Obras e Demandas:**
- ✅ `OBRAS_SHEET_ID` (já preenchido)
- ✅ `OBRAS_SHEET_NAME` (já preenchido)
- ✅ `OBRAS_SHEET_CLIENT_EMAIL` (já preenchido)
- ⚠️ `OBRAS_SHEET_PRIVATE_KEY` → **SUBSTITUIR pela chave real**
- ✅ `OBRAS_SHEET_PROJECT_ID` (já preenchido)

**📈 Projeção 2026:**
- ⚠️ `PROJECAO_SHEET_ID` → **SUBSTITUIR pelo ID real**
- ✅ `PROJECAO_SHEET_NAME` (já preenchido)
- ✅ `PROJECAO_SHEET_COLUMNS` (já preenchido)
- ⚠️ `PROJECAO_CLIENT_EMAIL` → **SUBSTITUIR pelo email real**
- ⚠️ `PROJECAO_PRIVATE_KEY` → **SUBSTITUIR pela chave real**

**💰 Emendas 2025:**
- ⚠️ `EMENDAS_SHEETS_CLIENT_EMAIL` → **SUBSTITUIR pelo email real**
- ⚠️ `EMENDAS_SHEETS_PRIVATE_KEY` → **SUBSTITUIR pela chave real**
- ⚠️ `EMENDAS_SHEET_ID` → **SUBSTITUIR pelo ID real**
- ✅ `EMENDAS_SHEET_NAME` (já preenchido)

**🗳️ Eleições Anteriores:**
- ⚠️ `GOOGLE_SHEETS_CLIENT_EMAIL` → **SUBSTITUIR pelo email real**
- ⚠️ `GOOGLE_SHEETS_PRIVATE_KEY` → **SUBSTITUIR pela chave real**
- ⚠️ `GOOGLE_SHEETS_SPREADSHEET_ID` → **SUBSTITUIR pelo ID real**

### **Passo 4: Onde Encontrar os Valores Reais**

#### **🔍 Google Service Account Keys:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **IAM & Admin > Service Accounts**
3. Encontre suas contas de serviço
4. Clique em **Actions > Manage Keys**
5. **Create New Key > JSON**
6. Copie o `private_key` do arquivo JSON baixado

#### **📊 Google Sheets IDs:**
- Abra a planilha no Google Sheets
- Na URL: `https://docs.google.com/spreadsheets/d/1AHOem5yg6wPWwOiCZRaZRsvwZPwsfbKs_xbb6SWtG-E/edit`
- O ID é: `1AHOem5yg6wPWwOiCZRaZRsvwZPwsfbKs_xbb6SWtG-E`

### **Passo 5: Validação e Teste**

#### **✅ Verificar Arquivo:**
```bash
# Testar se o arquivo não está corrompido
type .env.local
```

#### **🧪 Testar Localmente:**
```bash
npm run dev
```

#### **🔍 Verificar Logs:**
- Se aparecer erros de **"Unauthorized"** → Private keys incorretas
- Se aparecer **"Sheet not found"** → IDs de planilhas incorretos
- Se aparecer **"Invalid encoding"** → Arquivo ainda corrompido

### **Passo 6: Segurança**

#### **🛡️ Verificar .gitignore:**
Confirme que `.env.local` está no `.gitignore`:
```bash
# Verificar se está ignorado
type .gitignore | findstr env.local
```

#### **⚠️ NUNCA commitar:**
```bash
# ❌ NUNCA faça isso:
git add .env.local
git commit -m "Added env vars"  # PERIGOSO!

# ✅ Sempre verifique:
git status  # .env.local não deve aparecer
```

## 🚀 **Deploy no Vercel**

### **📤 Configurar Variáveis no Vercel:**
1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings > Environment Variables**
4. Adicione **TODAS** as variáveis do `.env.local` (exceto as comentadas)
5. Para **Production**, altere:
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_API_URL=https://seu-projeto.vercel.app`

### **🔄 Deploy:**
```bash
git push origin main
# Vercel fará deploy automaticamente
```

## 🆘 **Resolução de Problemas**

### **❌ "Cannot read properties of undefined"**
- **Causa:** Variável não definida ou nome incorreto
- **Solução:** Verificar nomes das variáveis no código vs `.env.local`

### **❌ "Invalid private key format"**
- **Causa:** Private key mal formatada
- **Solução:** Usar formato `"-----BEGIN...\\n...\\n-----END..."`

### **❌ "Sheet not accessible"**
- **Causa:** Service account sem permissão
- **Solução:** Compartilhar planilha com email da service account

### **❌ "Port 3006 already in use"**
- **Causa:** Processo anterior não finalizou
- **Solução:** `npx kill-port 3006` ou reiniciar sistema

## 📞 **Suporte**

Se ainda tiver problemas:
1. ✅ Verificar se **todas** as variáveis estão preenchidas
2. ✅ Confirmar formato das **private keys**
3. ✅ Testar uma variável por vez (comentar outras)
4. ✅ Verificar **permissões** das planilhas no Google Sheets

---

**🎯 RESULTADO ESPERADO:** Aplicação funcionando em `http://localhost:3006` com todas as integrações do Google Sheets ativas! 