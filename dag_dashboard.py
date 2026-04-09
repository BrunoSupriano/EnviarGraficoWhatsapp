"""
DAG — Gerar Dashboard e Enviar via WhatsApp
─────────────────────────────────────────────
Airflow 3.x  |  Roda todo dia às 12:00 (horário de Brasília)

A pasta inteira do projeto fica dentro de dags/, então os caminhos
são relativos ao diretório desta DAG.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta

from airflow.sdk import DAG, task

from airflow.providers.standard.operators.bash import BashOperator

# Diretório raiz do projeto = mesmo diretório desta DAG
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))

default_args = {
    "owner": "bruno",
    "depends_on_past": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

with DAG(
    dag_id="dashboard_whatsapp",
    default_args=default_args,
    description="Gera o dashboard PNG e envia para o grupo do WhatsApp",
    schedule="0 12 * * *",          # todo dia às 12:00 UTC-3 (ajuste timezone abaixo)
    start_date=datetime(2026, 4, 1),
    catchup=False,
    tags=["dashboard", "whatsapp", "celesc"],
    max_active_runs=1,
) as dag:

    gerar_dashboard = BashOperator(
        task_id="gerar_dashboard",
        bash_command=f"cd {PROJECT_DIR} && node tasks/gerar_dashboard.js",
        env={**os.environ},         # herda .env carregado pelo dotenv dentro do script
    )

    enviar_whatsapp = BashOperator(
        task_id="enviar_whatsapp",
        bash_command=f"cd {PROJECT_DIR} && node tasks/enviar_whatsapp.js",
        env={**os.environ},
    )

    gerar_dashboard >> enviar_whatsapp
