/**
 * TASK 2 — Envio via WhatsApp
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsabilidade: pegar o PNG gerado e enviar para o grupo do WhatsApp
 *
 * Entrada  : output/ (arquivo mais recente)  +  variáveis de ambiente
 * Saída    : mensagem enviada no grupo  +  exit code 0 (sucesso) / 1 (falha)
 *
 * Uso standalone : node tasks/enviar_whatsapp.js
 * Uso Airflow    : BashOperator(bash_command='node tasks/enviar_whatsapp.js')
 */

require('dotenv').config();

const { MessageMedia } = require('whatsapp-web.js');
const path    = require('path');
const fs      = require('fs');
const whatsapp = require('../backend/whatsapp');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const NOME_GRUPO = process.env.WHATSAPP_GROUP || 'Teste';
const CAPTION    = process.env.WHATSAPP_CAPTION || '📈 Relatório UCM — Atualizado automaticamente';

function getMaisRecente() {
    if (!fs.existsSync(OUTPUT_DIR)) return null;

    const arquivos = fs.readdirSync(OUTPUT_DIR)
        .filter(f => f.endsWith('.png'))
        .map(f => ({ nome: f, mtime: fs.statSync(path.join(OUTPUT_DIR, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);

    return arquivos.length > 0 ? path.join(OUTPUT_DIR, arquivos[0].nome) : null;
}

async function run() {
    const dashboardPath = getMaisRecente();

    if (!dashboardPath) {
        console.error('[TASK enviar_whatsapp] Nenhum arquivo PNG encontrado em output/');
        console.error('[TASK enviar_whatsapp] Execute a task gerar_dashboard primeiro.');
        process.exit(1);
    }

    const stats = fs.statSync(dashboardPath);
    console.log(`[TASK enviar_whatsapp] Arquivo : ${path.basename(dashboardPath)}`);
    console.log(`[TASK enviar_whatsapp] Tamanho : ${(stats.size / 1024).toFixed(1)} KB`);
    console.log(`[TASK enviar_whatsapp] Grupo   : "${NOME_GRUPO}"`);

    try {
        await whatsapp.initialize();

        whatsapp.client.once('ready', async () => {
            try {
                // Lista todos os grupos para diagnóstico
                const chats = await whatsapp.client.getChats();
                const grupos = chats.filter(c => c.isGroup);
                console.log(`[TASK enviar_whatsapp] Grupos disponíveis (${grupos.length}):`);
                grupos.forEach(g => console.log(`  - "${g.name}"`));

                const grupo = grupos.find(g =>
                    g.name.toLowerCase().includes(NOME_GRUPO.toLowerCase())
                );

                if (!grupo) {
                    console.error(`[TASK enviar_whatsapp] Grupo "${NOME_GRUPO}" não encontrado entre os listados acima.`);
                    process.exit(1);
                }

                console.log(`[TASK enviar_whatsapp] Grupo encontrado: "${grupo.name}" (${grupo.id._serialized})`);

                const media = MessageMedia.fromFilePath(dashboardPath);
                console.log(`[TASK enviar_whatsapp] Mídia carregada: ${media.mimetype} | dados: ${media.data.length} chars`);

                console.log('[TASK enviar_whatsapp] Enviando...');
                await whatsapp.sendMessage(grupo.id._serialized, media, CAPTION);

                console.log(`[TASK enviar_whatsapp] ✅ Mensagem enviada para: "${grupo.name}"`);

                // Aguarda o socket transmitir antes de destruir o cliente
                await new Promise(r => setTimeout(r, 4000));
                await whatsapp.destroy();

                console.log('[TASK enviar_whatsapp] Concluída com sucesso.');
                process.exit(0);

            } catch (err) {
                console.error('[TASK enviar_whatsapp] Falha no envio:', err.message);
                console.error(err.stack);
                await whatsapp.destroy();
                process.exit(1);
            }
        });

    } catch (err) {
        console.error('[TASK enviar_whatsapp] Falha ao inicializar WhatsApp:', err.message);
        process.exit(1);
    }
}

run();
