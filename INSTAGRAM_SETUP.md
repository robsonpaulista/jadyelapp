# Configuração do Instagram Analytics

## Visão Geral

O sistema de Instagram Analytics usa uma arquitetura segura onde as credenciais são armazenadas apenas no servidor e nunca são expostas ao cliente. Isso garante máxima segurança para uma aplicação corporativa.

## Arquitetura Segura

### 🔒 Como Funciona
1. **Credenciais no Servidor**: As credenciais ficam armazenadas apenas no servidor (variáveis de ambiente)
2. **API Route Segura**: Todas as chamadas para o Instagram passam por uma API route (`/api/instagram`)
3. **Cliente Protegido**: O frontend nunca tem acesso às credenciais reais
4. **Validação Centralizada**: A validação de tokens é feita no servidor

## Configuração Inicial (Uma vez só)

### 1. Obter Token de Acesso

1. Acesse o [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Selecione sua aplicação do Facebook
3. Adicione as permissões necessárias:
   - `instagram_basic`
   - `instagram_manage_insights`
   - `pages_read_engagement`
4. Gere um token de acesso de longa duração
5. Copie o token (começa com `EAAH...`)

### 2. Obter ID da Conta Business

1. Acesse o [Meta Business Suite](https://business.facebook.com/)
2. Vá para Configurações > Contas do Instagram
3. Copie o ID da conta business do Instagram
4. Ou use a API: `https://graph.facebook.com/v18.0/me/accounts?access_token=SEU_TOKEN`

### 3. Configurar Variáveis de Ambiente

1. Copie o arquivo `env.local.template` para `env.local`
2. Substitua os valores das variáveis:

```env
# Credenciais seguras (apenas servidor)
INSTAGRAM_TOKEN=EAAH... # Seu token real aqui
INSTAGRAM_BUSINESS_ID=123456789 # Seu ID real aqui
```

### 4. Configurar na Vercel (Produção)

1. Acesse o painel da Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione as variáveis:
   - `INSTAGRAM_TOKEN` = seu token real
   - `INSTAGRAM_BUSINESS_ID` = seu ID real
4. Faça deploy

### 5. Reiniciar a Aplicação

Após configurar as variáveis de ambiente, reinicie a aplicação para que as mudanças tenham efeito.

## Como Funciona

- **Usuários novos**: Acessam a página e veem os dados automaticamente
- **Token expirado**: Sistema mostra mensagem para contatar o administrador
- **Sem configuração**: Página mostra erro até as credenciais serem configuradas

## Manutenção

### Renovação de Token

Os tokens do Instagram expiram periodicamente. Quando isso acontecer:

1. O sistema mostrará a mensagem "Token do Instagram expirado. Entre em contato com o administrador."
2. O administrador deve gerar um novo token
3. Atualizar a variável `INSTAGRAM_TOKEN` no servidor
4. Reiniciar a aplicação

### Troubleshooting

- **Erro 190**: Token expirado - renovar token
- **Erro 100**: Permissões insuficientes - verificar permissões no Graph API Explorer
- **Erro de rede**: Verificar conectividade com a API do Facebook

## Segurança

### ✅ Medidas Implementadas
- **Credenciais apenas no servidor**: Nunca expostas ao cliente
- **API Route segura**: Todas as chamadas passam pelo backend
- **Validação centralizada**: Tokens validados no servidor
- **Sem exposição de dados sensíveis**: Interface limpa e segura

### 🔐 Benefícios
- **Máxima segurança**: Credenciais protegidas
- **Fácil manutenção**: Apenas administrador gerencia credenciais
- **Escalabilidade**: Funciona para todos os usuários
- **Conformidade**: Adequado para ambiente corporativo

## API Endpoints

### GET `/api/instagram`
- **Função**: Busca dados do Instagram
- **Segurança**: Usa credenciais do servidor
- **Retorno**: Dados formatados do Instagram

### POST `/api/instagram`
- **Função**: Valida credenciais fornecidas
- **Segurança**: Validação no servidor
- **Uso**: Apenas para configuração inicial 