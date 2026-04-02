const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');

const client = new Client({
    authStrategy: new LocalAuth(), // salva sessão localmente, não precisa escanear QR toda vez
    puppeteer: {
        headless: true,
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Exibe o QR Code no terminal para autenticação
client.on('qr', (qr) => {
    console.log('\n📱 Escaneie o QR Code abaixo com o WhatsApp:\n');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('✅ Autenticado com sucesso!');
});

client.on('ready', async () => {
    console.log('🟢 Cliente pronto!\n');

    // Lista todos os grupos disponíveis
    const chats = await client.getChats();
    const grupos = chats.filter(c => c.isGroup);

    if (grupos.length === 0) {
        console.log('Nenhum grupo encontrado.');
        return;
    }

    console.log('📋 Grupos disponíveis:');
    grupos.forEach(g => console.log(`  • ${g.name}`));

    // ─── CONFIGURAÇÃO ────────────────────────────────────────────
    // Nome exato do grupo (ou parte do nome — não diferencia maiúsculas/minúsculas)
    const NOME_GRUPO = 'Teste';
    // Coloque o caminho da imagem que deseja enviar
    const CAMINHO_IMAGEM = path.join(__dirname, 'imagem.jpg');
    // Legenda opcional
    const LEGENDA = 'Mensagem automática enviada via whatsapp-web.js';
    // ─────────────────────────────────────────────────────────────

    const grupo = grupos.find(g => g.name.toLowerCase().includes(NOME_GRUPO.toLowerCase()));

    if (!grupo) {
        console.error(`❌ Grupo "${NOME_GRUPO}" não encontrado. Grupos disponíveis acima.`);
        await client.destroy();
        process.exit(1);
    }

    console.log(`\n📤 Enviando imagem para: ${grupo.name}`);

    try {
        // Testa envio de texto primeiro
        console.log('📨 Enviando mensagem de texto de teste...');
        const resultTexto = await client.sendMessage(grupo.id._serialized, 'Teste de conexão 🤖');
        console.log('✅ Texto enviado! ID:', resultTexto.id._serialized);

        // Aguarda 2 segundos e envia a imagem
        await new Promise(r => setTimeout(r, 2000));

        console.log('📂 Carregando imagem:', CAMINHO_IMAGEM);
        const fs = require('fs');
        const imageData = fs.readFileSync(CAMINHO_IMAGEM);
        const base64 = imageData.toString('base64');
        const media = new MessageMedia('image/jpeg', base64, 'imagem.jpg');
        console.log('📨 Enviando imagem... tamanho base64:', base64.length);
        const result = await client.sendMessage(grupo.id._serialized, media, { caption: LEGENDA });
        console.log('✅ Imagem enviada! ID:', result.id._serialized);

        // Aguarda 10 segundos para garantir que o upload completou antes de fechar
        console.log('⏳ Aguardando upload completar...');
        await new Promise(r => setTimeout(r, 10000));
        console.log('✅ Pronto!');
    } catch (err) {
        console.error('❌ Erro:', err.message);
        console.error('Stack:', err.stack);
    }

    await client.destroy();
    process.exit(0);
});

client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
});

client.on('disconnected', (reason) => {
    console.log('🔴 Desconectado:', reason);
});

console.log('🚀 Iniciando cliente WhatsApp...');
client.initialize();
