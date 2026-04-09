/**
 * Orquestrador local — substituto do Airflow para rodar localmente.
 * Executa as tasks em sequência e para se alguma falhar.
 *
 * Em produção no Airflow, cada task abaixo vira um nó independente do DAG:
 *
 *   gerar_dashboard  >>  enviar_whatsapp
 */

const { execSync } = require('child_process');
const path = require('path');

const TASKS = [
    { nome: 'gerar_dashboard', script: '../tasks/gerar_dashboard.js' },
    { nome: 'enviar_whatsapp', script: '../tasks/enviar_whatsapp.js' },
];

function executarTask(task) {
    const scriptPath = path.resolve(__dirname, task.script);
    console.log(`\n▶  [Pipeline] Iniciando task: ${task.nome}`);
    try {
        execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
        console.log(`✅ [Pipeline] Task concluída: ${task.nome}`);
    } catch {
        console.error(`❌ [Pipeline] Task falhou: ${task.nome} — pipeline interrompido.`);
        process.exit(1);
    }
}

for (const task of TASKS) {
    executarTask(task);
}

console.log('\n🏁 [Pipeline] Todas as tasks concluídas com sucesso.');
