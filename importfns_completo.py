import requests
import pandas as pd
from datetime import datetime
import time

HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N)",
    "Referer": "https://consultafns.saude.gov.br/",
}

# 1. Obter municípios do Piauí
url_municipios = "https://consultafns.saude.gov.br/recursos/municipios/uf/PI"
resp = requests.get(url_municipios, headers=HEADERS)

if resp.status_code != 200:
    raise Exception(f"Erro ao obter municípios: {resp.status_code}")

municipios_data = resp.json()
municipios = municipios_data.get("resultado", [])

print(f"Encontrados {len(municipios)} municípios no PI.")

propostas_totais = []

# 2. Para cada município, buscar propostas
for municipio in municipios:
    codigo_ibge = municipio["coMunicipioIbge"]
    nome_municipio = municipio["noMunicipio"]
    print(f"Consultando propostas para {nome_municipio} ({codigo_ibge})...")

    page = 1
    while True:
        url_propostas = "https://consultafns.saude.gov.br/recursos/proposta/consultar"
        params = {
            "ano": "2025",
            "sgUf": "PI",
            "coMunicipioIbge": codigo_ibge,
            "count": 100,
            "page": page,
            "coEsfera": ""
        }

        try:
            r = requests.get(url_propostas, headers=HEADERS, params=params)
            r.raise_for_status()
            dados = r.json()

            propostas = dados.get("resultado", {}).get("itensPagina", [])

            if not propostas:
                break  # Não tem mais propostas nessa página

            for p in propostas:
                p["municipio"] = nome_municipio

            propostas_totais.extend(propostas)
            print(f"  Página {page}: {len(propostas)} propostas encontradas.")

            page += 1
            time.sleep(0.3)  # Respeitar limites da API

        except Exception as e:
            print(f"  ❌ Erro na consulta do município {nome_municipio}: {e}")
            break

print(f"Total de propostas coletadas: {len(propostas_totais)}")

# 3. Salvar CSV com todas as colunas disponíveis
if propostas_totais:
    df = pd.DataFrame(propostas_totais)

    agora = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    arquivo_csv = f"propostas_PI_2025_{agora}.csv"
    df.to_csv(arquivo_csv, index=False, encoding="utf-8-sig")
    print(f"✅ CSV salvo com {len(df)} propostas: {arquivo_csv}")
else:
    print("⚠️ Nenhuma proposta encontrada.")
