# Mutirão de Catarata - Sistema de Cadastro de Pacientes

Um sistema web responsivo para captação de informações socioeconômicas de pacientes que participarão de um mutirão de cirurgia de catarata.

## Funcionalidades

- **Design Responsivo**: Interface adaptada para desktop e dispositivos móveis
- **Tela de Login**: Autenticação com validação de campos e botão para visualizar a senha
- **Dashboard**: Resumo visual com cards e gráficos sobre os pacientes cadastrados
- **Gerador de QR Code**: Permite que pacientes acessem o formulário de cadastro via smartphone
- **Formulário de Cadastro**: Captação de dados sociais, econômicos e de saúde
- **Armazenamento Local**: Utiliza localStorage para manter os dados durante os testes
- **Notificação no WhatsApp**: Simulação de envio de mensagem de confirmação após cadastro

## Tecnologias Utilizadas

- **Next.js**: Framework React para renderização do lado do servidor
- **TypeScript**: Tipagem estática para maior segurança no código
- **TailwindCSS**: Framework CSS para estilização rápida e responsiva
- **Formik**: Gerenciamento de formulários
- **Yup**: Validação de dados
- **Chart.js**: Criação de gráficos interativos
- **React Icons**: Ícones para melhorar a experiência do usuário
- **QRCode.react**: Geração de QR Codes para acesso rápido

## Instruções de Uso

### Instalação

```bash
npm install
```

### Execução em ambiente de desenvolvimento

```bash
npm run dev
```

### Acesso

Após iniciar o servidor, acesse http://localhost:3000

### Credenciais de Teste

- Email: admin@hospital.com
- Senha: admin123

## Estrutura do Projeto

- `/src/app`: Páginas da aplicação (Login, Dashboard, Cadastro)
- `/src/components`: Componentes reutilizáveis
- `/src/lib`: Tipos e funções de armazenamento
- `/src/utils`: Utilitários, como validações de formulários

## Próximos Passos

- Implementação de backend real com banco de dados
- Integração com API de WhatsApp para envio real de mensagens
- Sistema de autenticação completo com recuperação de senha
- Exportação de relatórios em Excel e PDF
- Módulo de agendamento de consultas

# Integração com ChatGPT

O sistema agora possui um assistente virtual integrado que pode responder perguntas sobre cadastros, atendimentos e procedimentos médicos. Essa funcionalidade utiliza a API da OpenAI para gerar respostas inteligentes e contextualmente relevantes.

## Configuração

Para utilizar o assistente IA, siga os passos abaixo:

1. Obtenha uma chave de API da OpenAI em https://platform.openai.com/api-keys
2. Adicione sua chave no arquivo `.env.local`:

```
OPENAI_API_KEY=sk_sua_chave_api_aqui
```

3. Reinicie o servidor de desenvolvimento

## Utilização

O assistente pode ser acessado através do botão "Assistente IA" no topo da página de Central de Atendimentos. 

Algumas perguntas que você pode fazer:
- "Como faço para registrar um novo paciente?"
- "Qual a diferença entre agendamento e atendimento?"
- "Quais informações são necessárias para cadastro de paciente?"
- "Como posso buscar um paciente pelo CPF?"

## Personalização

O comportamento do assistente pode ser personalizado editando a instrução de sistema no arquivo `src/app/api/ai-search/route.ts`. A personalização inclui:

- Ajustar o tom e estilo de respostas
- Definir conhecimentos específicos
- Limitar ou expandir o escopo de conhecimento do assistente

## Custos

Lembre-se que o uso da API da OpenAI gera custos baseados no número de tokens processados. Consulte a página de preços atual da OpenAI para mais informações sobre os custos associados. 