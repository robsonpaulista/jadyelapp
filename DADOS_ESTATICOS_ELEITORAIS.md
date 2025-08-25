# 📊 Sistema de Dados Estáticos Eleitorais

## 🎯 Objetivo

Sistema para incluir dados estáticos de planilhas Excel (resultados eleitorais) na aplicação web, disponibilizando-os sem necessidade do PC local estar ligado.

## 🚀 Como Usar

### 1. **Converter sua planilha Excel para JSON**

```bash
# Instalar dependências (se necessário)
npm install xlsx

# Converter a planilha
node scripts/excelToResultadosEleitorais.js caminho/para/sua/planilha.xlsx
```

**Exemplo:**
```bash
node scripts/excelToResultadosEleitorais.js ./resultados_eleicoes_2024.xlsx
```

### 2. **O que acontece na conversão:**

- ✅ Lê qualquer planilha `.xlsx`
- ✅ Detecta cabeçalhos automaticamente
- ✅ Converte tipos de dados (números, strings)
- ✅ Normaliza nomes de colunas
- ✅ Gera arquivo `public/resultados-eleitorais.json`
- ✅ Inclui metadados (data, total de registros, etc.)

### 3. **Acessar os dados na aplicação:**

#### Via API (Recomendado):
```javascript
// GET com filtros via URL
const response = await fetch('/api/resultados-eleitorais?municipio=TERESINA&cargo=DEPUTADO FEDERAL&ano=2022');
const dados = await response.json();

// POST com filtros no body
const response = await fetch('/api/resultados-eleitorais', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filtros: {
      municipio: 'TERESINA',
      cargo: 'DEPUTADO FEDERAL',
      ano: 2022,
      limite: 100
    }
  })
});
```

#### Via JSON direto:
```javascript
// Acessar JSON diretamente (para dados pequenos)
const response = await fetch('/resultados-eleitorais.json');
const dados = await response.json();
```

## 🔧 Filtros Disponíveis

| Filtro | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| `municipio` | string | Nome do município (busca parcial) | `"TERESINA"` |
| `cargo` | string | Cargo eleitoral (busca parcial) | `"DEPUTADO FEDERAL"` |
| `ano` | number | Ano da eleição | `2022` |
| `turno` | number | Turno da eleição | `1` ou `2` |
| `partido` | string | Sigla do partido (busca parcial) | `"PT"` |
| `zona` | number | Zona eleitoral | `1` |
| `limite` | number | Máximo de registros (até 5000) | `100` |
| `offset` | number | Pular registros (paginação) | `50` |

## 📈 Resposta da API

```json
{
  "success": true,
  "message": "1250 registros encontrados",
  "data": [
    {
      "municipio": "TERESINA",
      "candidato": "JOÃO DA SILVA",
      "partido": "PT",
      "cargo": "DEPUTADO FEDERAL",
      "votos": 15000,
      "ano": 2022
    }
  ],
  "metadata": {
    "arquivo": "resultados_eleicoes_2024.xlsx",
    "dataProcessamento": "2024-01-15T10:30:00Z",
    "totalRegistros": 12000,
    "colunas": ["municipio", "candidato", "partido", ...],
    "versao": "1.0"
  },
  "estatisticas": {
    "totalRegistros": 12000,
    "totalFiltrados": 1250,
    "totalVotos": 2500000,
    "totalMunicipios": 224,
    "cargosDisponiveis": ["DEPUTADO FEDERAL", "DEPUTADO ESTADUAL", ...],
    "anosDisponiveis": [2020, 2022, 2024],
    "partidosDisponiveis": ["PT", "PSDB", "MDB", ...]
  }
}
```

## 💡 Exemplo de Uso em Componente React

```tsx
import { useState, useEffect } from 'react';
import { ApiResponseResultadoEleicao } from '@/types/resultadoEleicoes';

function MeuComponente() {
  const [dados, setDados] = useState([]);
  
  useEffect(() => {
    const carregarDados = async () => {
      const response = await fetch('/api/resultados-eleitorais?municipio=TERESINA');
      const resultado: ApiResponseResultadoEleicao = await response.json();
      
      if (resultado.success) {
        setDados(resultado.data);
      }
    };
    
    carregarDados();
  }, []);
  
  return (
    <div>
      {dados.map((item, index) => (
        <div key={index}>
          {item.candidato} - {item.votos} votos
        </div>
      ))}
    </div>
  );
}
```

## 🎨 Página de Exemplo

Acesse `/resultados-eleitorais-exemplo` para ver uma implementação completa com:

- ✅ Filtros interativos
- ✅ Estatísticas em tempo real
- ✅ Tabela responsiva
- ✅ Paginação automática
- ✅ Export de dados

## ⚡ Performance

- **Cache:** Dados ficam em cache por 5 minutos
- **Paginação:** Máximo 5000 registros por requisição
- **Compressão:** JSON é automaticamente comprimido pelo Vercel
- **CDN:** Arquivo JSON fica no CDN para acesso global rápido

## 🔄 Atualizando os Dados

Para atualizar os dados:

1. Substitua sua planilha Excel
2. Execute novamente o script de conversão
3. Faça commit e deploy
4. Os dados são atualizados automaticamente

## 🏗️ Estrutura de Arquivos

```
├── scripts/
│   └── excelToResultadosEleitorais.js    # Script de conversão
├── src/
│   ├── types/
│   │   └── resultadoEleicoes.ts          # Tipos TypeScript
│   └── app/
│       ├── api/
│       │   └── resultados-eleitorais/
│       │       └── route.ts              # API endpoint
│       └── resultados-eleitorais-exemplo/
│           └── page.tsx                  # Página de exemplo
└── public/
    └── resultados-eleitorais.json        # Dados convertidos
```

## 🚨 Limitações

- **Tamanho:** Recomendado até 50MB de dados JSON
- **Memória:** Para 12k registros, usa ~5-10MB de RAM
- **Cache:** Dados ficam em cache por 5 minutos
- **Concurrent:** Suporta múltiplas requisições simultâneas

## 🎯 Próximos Passos

1. ✅ Converter sua planilha
2. ✅ Testar a API
3. ✅ Integrar em suas páginas
4. ✅ Configurar filtros específicos
5. ✅ Implementar relatórios personalizados

---

**💬 Dúvidas?** Este sistema foi projetado para ser simples e eficiente. Os dados ficam disponíveis 24/7 sem depender do seu PC local!
