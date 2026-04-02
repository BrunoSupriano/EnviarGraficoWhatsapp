# WhatsApp Auto Image Sender

Envia uma imagem automaticamente para um grupo do WhatsApp usando [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js).

## Requisitos

- [Node.js](https://nodejs.org/) v18+
- Google Chrome instalado em `C:/Program Files/Google/Chrome/Application/chrome.exe`

## Instalação

```bash
npm install
```

## Configuração

1. Coloque a imagem que deseja enviar na pasta do projeto com o nome `imagem.jpg`

2. Edite as variáveis no `index.js`:

```js
const NOME_GRUPO = 'Nome do seu grupo'; // parte do nome já funciona
const CAMINHO_IMAGEM = path.join(__dirname, 'imagem.jpg');
const LEGENDA = 'Sua legenda aqui';
```

## Como rodar

```bash
node index.js
```

### Primeira execução

Na primeira vez, um QR Code será exibido no terminal:

1. Abra o WhatsApp no celular
2. Vá em **Dispositivos conectados > Conectar dispositivo**
3. Escaneie o QR Code

A sessão fica salva na pasta `.wwebjs_auth/` — nas próximas execuções não precisa escanear novamente.

### O que o script faz

1. Conecta ao WhatsApp Web via Chrome
2. Lista todos os grupos disponíveis no terminal
3. Encontra o grupo pelo nome configurado
4. Envia uma mensagem de texto de teste
5. Envia a imagem com legenda
6. Aguarda 10 segundos para garantir o upload e encerra

## Estrutura do projeto

```
TesteWpp/
├── index.js        # script principal
├── imagem.jpg      # imagem a ser enviada
├── package.json
└── .gitignore
```

## Observações

- A pasta `node_modules/` e `.wwebjs_auth/` são ignoradas pelo git
- O `.wwebjs_auth/` contém sua sessão autenticada — não compartilhe
- Esta biblioteca é não oficial e viola os Termos de Serviço do WhatsApp; use com moderação
