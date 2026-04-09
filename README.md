# WhatsApp Dashboard Bot

Automatiza a geração de dashboards a partir de dados do PostgreSQL e o envio para grupos do WhatsApp. O projeto é estruturado em tasks independentes, pensado para migração futura ao Apache Airflow.

---

## Estrutura do Projeto

```
├── tasks/
│   ├── gerar_dashboard.js   # Task 1 — busca dados no banco e gera o PNG
│   └── enviar_whatsapp.js   # Task 2 — envia o PNG para o grupo
│
├── backend/
│   ├── main.js              # Orquestrador local (roda as tasks em sequência)
│   ├── database.js          # Conexão e queries PostgreSQL
│   └── whatsapp.js          # Cliente WhatsApp (autenticação + envio)
│
├── frontend/
│   ├── dashboard.js         # Gerador de imagem via Puppeteer
│   └── templates/
│       └── dashboard.html   # Template visual (Chart.js, tema escuro)
│
├── output/
│   └── dashboard.png        # Imagem gerada pela Task 1, consumida pela Task 2
│
└── test-dashboard.js        # Teste isolado do dashboard (sem WhatsApp)
```

---

## Pré-requisitos

- Node.js 18+
- Google Chrome instalado (ou o Chrome bundled do Puppeteer, baixado automaticamente)
- PostgreSQL acessível com a view `celesc_2.despachoweb_gold`

---

## Instalação

```bash
npm install
```

---

## Configuração

Crie o arquivo `.env` na raiz com as credenciais:

```env
PG_USER=seu_usuario
PG_HOST=seu_host
PG_PORT=5433
PG_PASSWORD=sua_senha
PG_DBNAME=seu_db

WHATSAPP_GROUP=Nome do Grupo
WHATSAPP_CAPTION=📈 Relatório UCM — Atualizado automaticamente
```

> `WHATSAPP_GROUP` deve conter parte do nome do grupo (busca por correspondência parcial).

---

## Como Rodar

### Testar só o dashboard (sem WhatsApp)

Útil para validar o visual e a conexão com o banco antes de envolver o WhatsApp.

```bash
node test-dashboard.js
```

Gera o arquivo `output/dashboard.png`. Abra para conferir o resultado.

---

### Rodar as tasks individualmente

**Task 1 — Gerar o dashboard:**
```bash
node tasks/gerar_dashboard.js
```
Saída: `output/dashboard.png`

**Task 2 — Enviar via WhatsApp:**
```bash
node tasks/enviar_whatsapp.js
```
Entrada: `output/dashboard.png` (precisa existir)

Na primeira execução, o WhatsApp exibirá um QR Code no terminal — escaneie com o app para autenticar. A sessão fica salva em `backend/session/` para execuções futuras.

---

### Rodar o pipeline completo (local)

Executa as duas tasks em sequência. Se a Task 1 falhar, a Task 2 não é iniciada.

```bash
node backend/main.js
```

---

## Migração para Airflow

Cada task é um script Node.js independente com `exit code 0` (sucesso) ou `1` (falha), pronto para uso como `BashOperator`:

```python
from airflow.operators.bash import BashOperator

gerar_dashboard = BashOperator(
    task_id='gerar_dashboard',
    bash_command='node /caminho/tasks/gerar_dashboard.js',
)

enviar_whatsapp = BashOperator(
    task_id='enviar_whatsapp',
    bash_command='node /caminho/tasks/enviar_whatsapp.js',
)

gerar_dashboard >> enviar_whatsapp
```

O arquivo `output/dashboard.png` é o contrato entre as duas tasks — equivalente a um XCom baseado em filesystem.

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| Node.js | Runtime |
| whatsapp-web.js | Integração com WhatsApp |
| Puppeteer | Renderização do dashboard em PNG |
| Chart.js | Gráficos no template HTML |
| PostgreSQL (pg) | Fonte de dados |
| dotenv | Gerenciamento de credenciais |
