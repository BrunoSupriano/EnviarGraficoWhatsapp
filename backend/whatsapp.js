const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const path = require('path');

class WhatsAppBackend {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: path.join(__dirname, '..', 'session')
            }),
            puppeteer: {                headless: true,
                executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        this.client.on('qr', (qr) => {
            console.log('\n📱 Escaneie o QR Code abaixo:');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => console.log('🟢 [Backend] WhatsApp conectado com sucesso!'));
    }

    async initialize() {
        await this.client.initialize();
    }

    async findGroupByName(name) {
        const chats = await this.client.getChats();
        return chats.find(chat => chat.isGroup && chat.name.toLowerCase().includes(name.toLowerCase()));
    }

    async sendMessage(chatId, media, caption) {
        console.log(`📤 [Backend] Enviando mensagem para o chat: ${chatId}`);
        return await this.client.sendMessage(chatId, media, { caption });
    }

    async destroy() {
        await this.client.destroy();
        console.log('🔴 [Backend] Cliente WhatsApp desconectado.');
    }
}

module.exports = new WhatsAppBackend();
