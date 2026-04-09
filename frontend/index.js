const { MessageMedia } = require('whatsapp-web.js');

/**
 * Frontend - Responsável pela identidade visual e geração do gráfico.
 */
class DashboardFrontend {
    async generateChartImage(data, title = 'Relatório Automático') {
        const chartConfig = {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets
            },
            options: {
                title: {
                    display: true,
                    text: title,
                    fontSize: 22
                },
                legend: { position: 'bottom' }
            }
        };

        const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=800&height=500&backgroundColor=white`;
        
        console.log('🎨 [Frontend] Renderizando gráfico...');
        return await MessageMedia.fromUrl(chartUrl, { unsafeMime: true });
    }
}

module.exports = new DashboardFrontend();
