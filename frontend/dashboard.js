const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'dashboard.html');
const OUTPUT_DIR    = path.join(__dirname, '..', 'output');

class DashboardService {
    /**
     * Gera a imagem do dashboard a partir do config declarativo.
     *
     * @param {Object} config   - Objeto do dashboard.config.js
     * @param {Object} dados    - { nomeQuery: [rows] } retornado por database.executarTodasDoConfig()
     * @param {string} filename - Nome do arquivo PNG de saída
     * @returns {string}        - Caminho absoluto do PNG gerado
     */
    async gerarDashboard(config, resultado, filename = 'dashboard.png') {
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        const outputPath = path.join(OUTPUT_DIR, filename);
        const totalRegistros = [...resultado.kpis, ...resultado.graficos].reduce((s, item) => s + (item.rows?.length || 0), 0);
        console.log(`🎨 [Dashboard] Gerando imagem (${totalRegistros} registros)...`);

        // Injeta o payload { config, resultado } antes dos scripts do template rodarem
        let templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
        const dataScript = `<script>window.__PAYLOAD__ = ${JSON.stringify({ config, resultado })};</script>`;
        let htmlFinal = templateHtml.replace('</head>', `${dataScript}\n</head>`);

        // Substitui src da logo por base64 para funcionar com setContent (sem URL base)
        const logoPath = path.join(__dirname, '..', 'assets', 'logo redondo_verde_Prancheta 1.png');
        if (fs.existsSync(logoPath)) {
            const logoBase64 = fs.readFileSync(logoPath).toString('base64');
            const logoDataUrl = `data:image/png;base64,${logoBase64}`;
            htmlFinal = htmlFinal.replace(
                /src="[^"]*logo redondo_verde_Prancheta 1\.png"/,
                `src="${logoDataUrl}"`
            );
        }

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: this._resolveChrome(),
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
        });

        try {
            const page = await browser.newPage();

            // Viewport fixo 1920×1080 (16:9)
            await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

            // Carrega o HTML já com os dados embutidos
            await page.setContent(htmlFinal, { waitUntil: 'networkidle2', timeout: 30000 });

            // Aguarda o Chart.js terminar de renderizar
            await page.waitForFunction(() => {
                return typeof Chart !== 'undefined' && document.querySelector('canvas') !== null;
            }, { timeout: 15000 });

            await new Promise(r => setTimeout(r, 1000));

            // Screenshot com dimensões exatas 1920×1080
            await page.screenshot({
                path: outputPath,
                clip: { x: 0, y: 0, width: 1920, height: 1080 },
                type: 'png'
            });

            console.log(`✅ [Dashboard] Imagem salva em: ${outputPath}`);
            return outputPath;

        } finally {
            await browser.close();
        }
    }

    /**
     * Resolve o caminho do Chrome: usa o bundled do Puppeteer ou o do sistema.
     */
    _resolveChrome() {
        // Chrome bundled pelo Puppeteer (prioridade)
        try {
            const { executablePath } = require('puppeteer');
            const exe = executablePath();
            if (fs.existsSync(exe)) return exe;
        } catch (_) {}

        // Fallback: Chrome do sistema (caminho do whatsapp.js)
        const systemChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
        if (fs.existsSync(systemChrome)) return systemChrome;

        throw new Error('[Dashboard] Nenhum executável do Chrome encontrado.');
    }
}

module.exports = new DashboardService();
