/**
 * TASK 1 — Geração do Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsabilidade: ler o dashboard.config.js, executar as queries e gerar PNG
 *
 * Para adicionar indicadores ou gráficos, edite:
 *   - dashboard.config.js  (o quê exibir)
 *   - backend/queries.js   (os SQLs)
 *
 * Entrada  : dashboard.config.js + banco de dados (via .env)
 * Saída    : output/dashboard_YYYY-MM-DD_HH-mm.png  +  exit code 0/1
 *
 * Uso standalone : node tasks/gerar_dashboard.js
 * Uso Airflow    : BashOperator(bash_command='node tasks/gerar_dashboard.js')
 */

require('dotenv').config();

const database = require('../backend/database');
const dashboard = require('../frontend/dashboard');
const config    = require('../dashboard.config');

async function run() {
    try {
        await database.testConnection();

        // Executa todos os SQLs do config (KPIs + gráficos) em paralelo
        const resultado = await database.executarConfig(config);

        // Timestamp em horário de Brasília (UTC-3)
        const agora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const pad = n => String(n).padStart(2, '0');
        const ts = `${agora.getFullYear()}-${pad(agora.getMonth()+1)}-${pad(agora.getDate())}_${pad(agora.getHours())}-${pad(agora.getMinutes())}`;
        const filename = `dashboard_${ts}.png`;

        await dashboard.gerarDashboard(config, resultado, filename);

        console.log(`[TASK gerar_dashboard] Arquivo gerado: output/${filename}`);
        console.log('[TASK gerar_dashboard] Concluída com sucesso.');
        process.exit(0);

    } catch (err) {
        console.error('[TASK gerar_dashboard] Falha:', err.message);
        process.exit(1);

    } finally {
        await database.close();
    }
}

run();
