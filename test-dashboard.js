/**
 * Teste isolado do dashboard — sem precisar do WhatsApp.
 * Roda: node test-dashboard.js
 */
const database  = require('./backend/database');
const dashboard = require('./frontend/dashboard');
const path      = require('path');

async function testar() {
    console.log('🧪 [Teste] Iniciando geração de dashboard...\n');

    try {
        // 1. Testa conexão com o banco
        await database.testConnection();

        // 2. Busca os dados
        const dados = await database.getVendasAgrupadas();
        console.log(`📋 [Teste] ${dados.length} registros recebidos do banco.`);

        // 3. Gera o dashboard
        const imagemPath = await dashboard.gerarDashboard(dados, {
            titulo:    'Resumo Produção Contrato',
            subtitulo: 'Base: celesc_2.despachoweb_gold',
            filename:  'dashboard.png'
        });

        console.log(`\n🖼️  Dashboard gerado com sucesso!`);
        console.log(`📂 Caminho: ${imagemPath}`);
        console.log(`\n👉 Abra o arquivo acima para conferir o visual.`);

    } catch (err) {
        console.error('\n❌ [Teste] Erro:', err.message);
    } finally {
        await database.close();
    }
}

testar();
