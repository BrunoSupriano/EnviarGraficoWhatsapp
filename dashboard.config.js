/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                        DASHBOARD CONFIG                                 ║
 * ║  Único arquivo que você precisa editar para mudar o dashboard.           ║
 * ║  Funciona como o Power BI: cada visual tem sua própria fonte de dados.   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * ─── COMO ADICIONAR UM NOVO GRÁFICO ─────────────────────────────────────────
 *  1. Copie um dos blocos dentro de "graficos: [...]"
 *  2. Troque o "sql" pela sua query — deve retornar "label" e "valor"
 *  3. Rode: node tasks/gerar_dashboard.js
 *
 * ─── COMO ADICIONAR UM NOVO CARD (KPI) ──────────────────────────────────────
 *  1. Copie um dos blocos dentro de "kpis: [...]"
 *  2. Troque o "sql" — deve retornar UMA linha com o campo "valor"
 *  3. Rode: node tasks/gerar_dashboard.js
 *
 * ─── FORMATOS ────────────────────────────────────────────────────────────────
 *  'moeda'      →  R$ 1.234.567
 *  'inteiro'    →  1.235
 *  'numero'     →  1.234.567,89
 *  'percentual' →  42,3%
 *  'texto'      →  exibe como está
 *
 * ─── TIPOS DE GRÁFICO ────────────────────────────────────────────────────────
 *  'bar'  'line'  'pie'  'doughnut'
 *
 * ─── CORES DOS CARDS ─────────────────────────────────────────────────────────
 *  'primary'   →  verde claro   (#5bb98e)
 *  'secondary' →  verde escuro  (#008c6a)
 *  'muted'     →  cinza-verde   (#a3c4bc)
 *
 * ─── JOINS DE DATA DISPONÍVEIS ───────────────────────────────────────────────
 *  Relacionamento entre tabelas:
 *    despachoweb_gold."data_chegadaocorrencia"  (tipo: date)
 *    JOIN celesc_2.calendario c ON c.date::date = d.data_chegadaocorrencia
 *
 *  Colunas úteis do calendário:
 *    c."Mês/Ano"      →  ex: '04/2026'   (use com TO_CHAR(CURRENT_DATE,'MM/YYYY'))
 *    c."Tipo de Dia"  →  'Dia Útil' | 'Sábado' | 'Domingo' | feriado
 *    c."Dia do Mês"   →  número do dia (1, 2, 3...)
 *    c."Dia/Mês"      →  ex: '02/04'
 */

module.exports = {

    // ── Cabeçalho ─────────────────────────────────────────────────────────────
    titulo:    'UCM — Mês Atual',
    subtitulo: 'celesc_2.despachoweb_gold  ×  celesc_2.calendario',


    // ══════════════════════════════════════════════════════════════════════════
    // CARDS DE INDICADOR (KPI)
    // Cada card executa um SQL independente e mostra o resultado.
    // O SQL deve retornar UMA linha. Use "valor" para o número.
    // Use "label" como subtítulo dinâmico quando "subDoCampo: true".
    // ══════════════════════════════════════════════════════════════════════════
    kpis: [

        // ── KPI oculto: meta mensal (referenciado pelo card de faturamento) ────
        {
            id:     'metaMes',
            oculto: true,   // não aparece no grid; só serve de referência numérica
            label:  'Meta do Mês',
            formato:'moeda',
            sql: `
                SELECT SUM("FATURAMENTO TOTAL") AS valor
                FROM celesc_2.gs_metasmes
                WHERE "REFERÊNCIA" = TO_CHAR(CURRENT_DATE, 'MM/YYYY')
            `,
        },

        // ── Total acumulado no mês atual ──────────────────────────────────
        {
            id:      'totalMes',
            label:   'Total Produzido — Mês Atual',
            cor:     'primary',
            sub:     'acumulado até hoje',
            formato: 'moeda',
            metaProporRef: 'metaMes',   // badge: % da meta proporcional
            totalRef:      'totalMes',  // compara consigo mesmo
            sql: `
                SELECT SUM(d."Valor_Total_UCM") AS valor
                FROM celesc_2.despachoweb_gold d
                JOIN celesc_2.calendario c ON c.date::date = d.data_chegadaocorrencia
                WHERE c."Mês/Ano" = TO_CHAR(CURRENT_DATE, 'MM/YYYY')
            `,
        },

        // ── Meta proporcional até o maior dia com dados ───────────────────
        // O valor é calculado no template: metaMes / 30 * maxDia
        {
            label:         'Meta Proporcional',
            cor:           'muted',
            sub:           'meta até o dia atual',
            formato:       'moeda',
            metaProporRef: 'metaMes',   // fonte da meta mensal (valor sobrescrito no template)
            sql: `SELECT 0 AS valor`,
        },

        // ── Projeção para o fim do mês ──────────────────────────────────────
        {
            label:   'Projeção Fim do Mês',
            cor:     'secondary',
            sub:     'projeção acumulada ao fim do mês',
            formato: 'moeda',
            metaRef: 'metaMes',   // compara projeção vs meta mensal
            sql: `
                SELECT
                    SUM(v.resultado_projetado) AS valor
                FROM celesc_2.vw_projecao_resultado v
                WHERE v.ano_mes = TO_CHAR(CURRENT_DATE, 'MM/YYYY')
                  AND DATE(v.date) = (
                      SELECT MAX(DATE(date))
                      FROM celesc_2.vw_projecao_resultado
                      WHERE ano_mes = TO_CHAR(CURRENT_DATE, 'MM/YYYY')
                  )
            `,
        },

        // ── Meta total do mês ────────────────────────────────────────────
        {
            label:   'Meta do Mês',
            cor:     'muted',
            sub:     'meta mensal total',
            formato: 'moeda',
            sql: `
                SELECT SUM("FATURAMENTO TOTAL") AS valor
                FROM celesc_2.gs_metasmes
                WHERE "REFERÊNCIA" = TO_CHAR(CURRENT_DATE, 'MM/YYYY')
            `,
        },

        // ── Adicione novos cards aqui ──────────────────────────────────────
        // {
        //     label:   'Contratos Ativos',
        //     cor:     'muted',
        //     sub:     'com OCR no mês',
        //     formato: 'inteiro',
        //     sql: `
        //         SELECT COUNT(DISTINCT d."CONTRATO") AS valor
        //         FROM celesc_2.despachoweb_gold d
        //         JOIN celesc_2.calendario c ON c.date::date = d.data_chegadaocorrencia
        //         WHERE c."Mês/Ano" = TO_CHAR(CURRENT_DATE, 'MM/YYYY')
        //     `,
        // },

    ],


    // ══════════════════════════════════════════════════════════════════════════
    // GRÁFICOS
    // O SQL deve retornar duas colunas: "label" (eixo X) e "valor" (eixo Y).
    // Os dados são filtrados para o mês atual via JOIN com o calendário.
    // ══════════════════════════════════════════════════════════════════════════
    graficos: [

        // ── Valor Produzido dia do mês (evolução diária) ──────────────────────────
        // Mostra como o valor foi chegando dia a dia no mês atual
        // ── Evolução diária real (só dados já registrados) ────────────────
        {
            titulo:   'Evolução Diária — UCM no Mês',
            tipo:     'line',
            formato:  'moeda',
            sql: `
                SELECT
                    c."Dia/Mês"                          AS label,
                    COALESCE(SUM(d."Valor_Total_UCM"), 0) AS valor
                FROM celesc_2.calendario c
                LEFT JOIN celesc_2.despachoweb_gold d
                       ON d.data_chegadaocorrencia = c.date::date
                WHERE c."Mês/Ano"  = TO_CHAR(CURRENT_DATE, 'MM/YYYY')
                  AND c.date::date <= CURRENT_DATE
                GROUP BY c."Dia/Mês", c."Dia do Mês"
                ORDER BY c."Dia do Mês"
            `,
        },

        // ── Produzido no mês atual (ranking) — barras sobrepostas com meta ──
        {
            titulo:  'Valor Produzido vs Meta — Mês Atual',
            tipo:    'bar',
            formato: 'moeda',
            sql: `
                SELECT
                    d."CONTRATO"             AS label,
                    SUM(d."Valor_Total_UCM") AS valor
                FROM celesc_2.despachoweb_gold d
                JOIN celesc_2.calendario c ON c.date::date = d.data_chegadaocorrencia
                WHERE c."Mês/Ano" = TO_CHAR(CURRENT_DATE, 'MM/YYYY')
                  AND UPPER(TRIM(d."CONTRATO")) != 'DESCONSIDERADO'
                GROUP BY d."CONTRATO"
                ORDER BY valor DESC NULLS LAST
                LIMIT 10
            `,
            metaSql: `
                SELECT
                    "CONTRATO" AS label,
                    "FATURAMENTO TOTAL" AS valor
                FROM celesc_2.gs_metasmes
                WHERE "REFERÊNCIA" = TO_CHAR(CURRENT_DATE, 'MM/YYYY')
                  AND UPPER(TRIM("CONTRATO")) != 'DESCONSIDERADO'
            `,
        },

                // ── Projeção do mês completo (média dos últimos dias × dias úteis do mês) ──
        {
            titulo:  'Projeção — UCM Mês Completo',
            tipo:    'line',
            formato: 'moeda',
            sql: `
                SELECT
                    TO_CHAR(DATE(v.date), 'DD/MM') AS label,
                    SUM(v.resultado_projetado)      AS valor
                FROM celesc_2.vw_projecao_resultado v
                WHERE v.ano_mes = TO_CHAR(CURRENT_DATE, 'MM/YYYY')
                GROUP BY DATE(v.date)
                ORDER BY DATE(v.date)
            `,
        },

        // ── Adicione novos gráficos aqui ──────────────────────────────────
        // {
        //     titulo:  'Distribuição por Contrato',
        //     tipo:    'doughnut',
        //     formato: 'moeda',
        //     sql: `
        //         SELECT
        //             d."CONTRATO"             AS label,
        //             SUM(d."Valor_Total_UCM") AS valor
        //         FROM celesc_2.despachoweb_gold d
        //         JOIN celesc_2.calendario c ON c.date::date = d.data_chegadaocorrencia
        //         WHERE c."Mês/Ano" = TO_CHAR(CURRENT_DATE, 'MM/YYYY')
        //         GROUP BY d."CONTRATO"
        //         ORDER BY valor DESC NULLS LAST
        //     `,
        // },

    ],


    // ══════════════════════════════════════════════════════════════════════════
    // TABELA DE RANKING
    // Usa automaticamente o SQL do último gráfico do tipo 'bar'.
    // Ou defina um "sql" próprio abaixo.
    // ══════════════════════════════════════════════════════════════════════════
    tabela: {
        exibir: true,
        titulo: 'Ranking — Projeção vs Meta',
        projecaoSql: `
            SELECT
                cc."CONTRATO"                    AS label,
                SUM(v.resultado_projetado)        AS valor
            FROM celesc_2.vw_projecao_resultado v
            JOIN celesc_2.ex_x_centro_custo cc
              ON cc."PREFIXO SAP" = v."idTurma"
            WHERE v.ano_mes = TO_CHAR(CURRENT_DATE, 'MM/YYYY')
              AND DATE(v.date) = (
                  SELECT MAX(DATE(date))
                  FROM celesc_2.vw_projecao_resultado
                  WHERE ano_mes = TO_CHAR(CURRENT_DATE, 'MM/YYYY')
              )
              AND UPPER(TRIM(cc."CONTRATO")) != 'DESCONSIDERADO'
            GROUP BY cc."CONTRATO"
        `,
        metaSql: `
            SELECT
                "CONTRATO" AS label,
                "FATURAMENTO TOTAL" AS valor
            FROM celesc_2.gs_metasmes
            WHERE "REFERÊNCIA" = TO_CHAR(CURRENT_DATE, 'MM/YYYY')
              AND UPPER(TRIM("CONTRATO")) != 'DESCONSIDERADO'
        `,
    },

};
