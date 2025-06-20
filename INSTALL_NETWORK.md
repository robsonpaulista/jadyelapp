# Configuração do Sistema para Uso em Rede Local

Este guia explica como configurar a aplicação para ser acessada por outros computadores na rede local, bem como preparar um ambiente de produção.

## Ambiente de Desenvolvimento com Acesso via Rede

### Pré-requisitos
- Node.js instalado (versão 18 ou superior)
- NPM ou Yarn
- Git para controle de versão

### Passos para disponibilizar na rede local

1. **Identificar o endereço IP do computador na rede local**
   ```
   ipconfig /all
   ```
   Anote o endereço IPv4 (algo como 192.168.x.x)

2. **Iniciar o servidor em modo rede**
   ```
   npm run dev:network
   ```
   Isso iniciará o servidor na porta 3006 e permitirá acesso de outros computadores da rede.

3. **Acesso via outros computadores**
   Em outros computadores da rede, acesse no navegador:
   ```
   http://192.168.1.103:3006
   ```
   (Substitua pelo IP real do seu computador)

### Configuração do Firewall
Se outros computadores não conseguirem acessar, pode ser necessário permitir a entrada na porta 3006 no firewall do Windows:

1. Abra o Firewall do Windows
2. Clique em "Regras de Entrada" e depois em "Nova Regra..."
3. Selecione "Porta" e clique em "Avançar"
4. Selecione "TCP" e especifique a porta "3006"
5. Permita a conexão e nomeie a regra (ex: "Next.js Dev Server")

## Ambiente de Produção

Para um ambiente de produção mais robusto, siga estas etapas:

### Opção 1: Usar o servidor integrado do Next.js

1. **Construir a aplicação para produção**
   ```
   npm run build
   ```

2. **Iniciar o servidor em modo produção**
   ```
   npm run start
   ```
   Ou use o comando que faz os dois passos:
   ```
   npm run start:prod
   ```

### Opção 2: Configuração com PM2 (mais robusta)

PM2 é um gerenciador de processos que mantém a aplicação online mesmo após erros ou reinicializações do sistema.

1. **Instalar PM2 globalmente**
   ```
   npm install -g pm2
   ```

2. **Construir a aplicação**
   ```
   npm run build
   ```

3. **Iniciar com PM2**
   ```
   pm2 start npm --name "mutirao_catarata" -- start
   ```

4. **Configurar para iniciar automaticamente**
   ```
   pm2 startup
   pm2 save
   ```

### Opção 3: Configuração com NGINX (para produção profissional)

1. **Instalar NGINX**
   Baixe e instale de [nginx.org](http://nginx.org/en/download.html)

2. **Configurar NGINX como proxy reverso**
   Edite `C:\nginx\conf\nginx.conf` e adicione:

   ```nginx
   server {
       listen 80;
       server_name localhost;

       location / {
           proxy_pass http://localhost:3006;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Iniciar NGINX**
   ```
   C:\nginx\nginx.exe
   ```

4. **Iniciar o servidor Next.js**
   ```
   npm run start
   ```

## Atualizando a Aplicação

Para atualizar a aplicação após modificações:

1. **Pare o servidor atual**
   - Se estiver em desenvolvimento: Ctrl+C no terminal
   - Se estiver com PM2: `pm2 stop mutirao_catarata`

2. **Faça suas alterações no código**

3. **Reconstrua a aplicação**
   ```
   npm run build
   ```

4. **Reinicie o servidor**
   - Para desenvolvimento: `npm run dev:network`
   - Com PM2: `pm2 restart mutirao_catarata`
   - Servidor simples: `npm run start`

## Solução de Problemas

### Porta já em uso
Se receber erro "address already in use", execute:
```
taskkill /F /IM node.exe
```
Ou use uma porta alternativa:
```
npm run dev:alt
```

### Problemas de Acesso à Rede
- Verifique se o firewall permite conexões na porta 3006
- Confirme se os dispositivos estão na mesma rede
- Verifique se o endereço IP está correto

### Banco de Dados
Esta aplicação utiliza Google Sheets como banco de dados. Certifique-se de que as credenciais estão configuradas corretamente nos arquivos de ambiente. 