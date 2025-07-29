# 📊 APIs Governamentais - Análise Territorial

Este documento explica como obter e configurar as APIs governamentais necessárias para o módulo de Análise Territorial.

## 🔑 APIs Necessárias

### 1. Portal da Transparência
**URL:** https://api.portaldatransparencia.gov.br/api-de-dados/emendas-parlamentares
**Dados:** Emendas parlamentares, execução orçamentária, empenho/liquidação/pagamento

**Como obter a chave:**
1. Acesse: https://api.portaldatransparencia.gov.br/
2. Clique em "Cadastre-se"
3. Preencha os dados solicitados
4. Aguarde aprovação (geralmente 24-48h)
5. Acesse sua conta e copie a chave da API

**Configuração:**
```env
PORTAL_TRANSPARENCIA_API_KEY=sua_chave_aqui
```

### 2. Tesouro Transparente
**URL:** https://apidadosabertos.tesouro.gov.br/cauc/v1/municipios/{codigo}
**Dados:** CAUC (Cadastro Único de Convênios), situação de adimplência municipal

**Como obter a chave:**
1. Acesse: https://apidadosabertos.tesouro.gov.br/
2. Clique em "Solicitar Acesso"
3. Preencha o formulário de solicitação
4. Aguarde aprovação (pode levar alguns dias)
5. Receba a chave por email

**Configuração:**
```env
TESOURO_TRANSPARENTE_API_KEY=sua_chave_aqui
```

### 3. Transferegov (Futuro)
**URL:** https://docs.api.transferegov.gestao.gov.br/
**Dados:** Transferências especiais (RP6), convênios, termos

**Status:** Em desenvolvimento
**Configuração:**
```env
TRANSFEREGOV_API_KEY=sua_chave_aqui
```

### 4. Obrasgov (Futuro)
**URL:** https://api.obrasgov.gestao.gov.br/
**Dados:** Execução física de obras, geolocalização, status

**Status:** Em desenvolvimento
**Configuração:**
```env
OBRASGOV_API_KEY=sua_chave_aqui
```

## 🚀 Configuração Rápida

1. **Copie o template:**
```bash
cp env.local.template .env.local
```

2. **Edite o arquivo .env.local:**
```env
# Portal da Transparência
PORTAL_TRANSPARENCIA_API_KEY=sua_chave_portal_transparencia

# Tesouro Transparente
TESOURO_TRANSPARENTE_API_KEY=sua_chave_tesouro_transparente
```

3. **Reinicie o servidor:**
```bash
npm run dev
```

## 📊 Dados Disponíveis

### Portal da Transparência
- ✅ Emendas parlamentares por município
- ✅ Valor empenhado, liquidado e pago
- ✅ Datas de empenho, liquidação e pagamento
- ✅ Objeto do gasto
- ✅ Classificação funcional-programática

### Tesouro Transparente
- ✅ Situação CAUC por município
- ✅ Itens de regularidade
- ✅ Histórico de eventos
- ✅ Última atualização

## 🔄 Fallback Strategy

Se as APIs não estiverem disponíveis ou retornarem erro:
1. Sistema usa dados simulados (mock)
2. Logs de erro são registrados
3. Interface continua funcionando
4. Dados reais são carregados quando disponíveis

## 📈 Próximos Passos

1. **Implementar Transferegov** - Transferências especiais
2. **Implementar Obrasgov** - Execução física
3. **Melhorar cache** - Otimizar performance
4. **Adicionar métricas** - Gini, overlap eleitoral
5. **Dashboard avançado** - Gráficos e análises

## 🛠️ Desenvolvimento

Para desenvolvimento local sem chaves:
- Sistema usa dados simulados automaticamente
- Logs mostram tentativas de API
- Interface funciona normalmente
- Dados reais carregam quando chaves são configuradas 