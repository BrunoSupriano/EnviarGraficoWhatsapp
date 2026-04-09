require('dotenv').config();
const { Pool } = require('pg');

class DatabaseService {
    constructor() {
        this.pool = new Pool({
            user:     process.env.PG_USER,
            host:     process.env.PG_HOST,
            database: process.env.PG_DBNAME,
            password: process.env.PG_PASSWORD,
            port:     process.env.PG_PORT,
        });
    }

    async testConnection() {
        const client = await this.pool.connect();
        console.log('🔗 [Database] Conexão com PostgreSQL bem-sucedida!');
        client.release();
    }

    // Executa um SQL e retorna as linhas
    async executarSQL(sql) {
        const res = await this.pool.query(sql);
        return res.rows;
    }

    /**
     * Lê o dashboard.config.js, executa todos os SQLs definidos
     * e devolve os resultados prontos para o template renderizar.
     *
     * Retorna um objeto com três chaves:
     *   kpis:     [ { config do card + rows da query } ]
     *   graficos: [ { config do gráfico + rows da query } ]
     *   tabela:   { config da tabela + rows da query }
     */
    async executarConfig(config) {
        console.log('📊 [Database] Executando queries do dashboard...');

        // Executa KPIs em paralelo
        const kpis = await Promise.all(
            config.kpis.map(async (kpi, i) => {
                console.log(`   KPI ${i + 1}: ${kpi.label}`);
                const rows = await this.executarSQL(kpi.sql);
                return { ...kpi, rows };
            })
        );

        // Executa gráficos em paralelo
        const graficos = await Promise.all(
            config.graficos.map(async (graf, i) => {
                console.log(`   Gráfico ${i + 1}: ${graf.titulo}`);
                const rows = await this.executarSQL(graf.sql);
                const metaRows = graf.metaSql ? await this.executarSQL(graf.metaSql) : null;
                return { ...graf, rows, metaRows };
            })
        );

        // Tabela: usa sql próprio, ou reutiliza o último gráfico de barras
        let tabela = null;
        if (config.tabela?.exibir) {
            if (config.tabela.sql || config.tabela.projecaoSql) {
                console.log(`   Tabela: queries próprias`);
                const rows = config.tabela.sql
                    ? await this.executarSQL(config.tabela.sql)
                    : [];
                const projecaoRows = config.tabela.projecaoSql
                    ? await this.executarSQL(config.tabela.projecaoSql)
                    : null;
                const metaRows = config.tabela.metaSql
                    ? await this.executarSQL(config.tabela.metaSql)
                    : null;
                tabela = { ...config.tabela, rows, projecaoRows, metaRows };
            } else {
                const barGraf = [...graficos].reverse().find(g => g.tipo === 'bar') ?? graficos[0];
                tabela = { ...config.tabela, rows: barGraf?.rows ?? [] };
            }
        }

        return { kpis, graficos, tabela };
    }

    async close() {
        await this.pool.end();
        console.log('🔌 [Database] Conexões encerradas.');
    }
}

module.exports = new DatabaseService();
