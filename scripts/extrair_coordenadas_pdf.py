#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para extrair coordenadas de municípios do Piauí do PDF
e salvar em formato JSON para uso no mapa web.
"""

import json
import re
import sys
from pathlib import Path

# Instalar dependências necessárias:
# pip install PyPDF2 pdfplumber

def extrair_coordenadas_com_pdfplumber():
    """Extrai coordenadas usando pdfplumber (mais preciso para tabelas)"""
    try:
        import pdfplumber
    except ImportError:
        print("❌ pdfplumber não instalado. Execute: pip install pdfplumber")
        return None
    
    pdf_path = Path("../latitudelongitude.pdf")
    if not pdf_path.exists():
        pdf_path = Path("latitudelongitude.pdf")
    
    if not pdf_path.exists():
        print("❌ Arquivo latitudelongitude.pdf não encontrado")
        return None
    
    municipios = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"📄 PDF aberto com {len(pdf.pages)} páginas")
            
            for page_num, page in enumerate(pdf.pages):
                print(f"📖 Processando página {page_num + 1}...")
                
                # Extrair texto da página
                text = page.extract_text()
                if not text:
                    continue
                
                # Procurar por linhas que contenham coordenadas
                # Formato esperado: Nome do Município | Latitude | Longitude
                lines = text.split('\n')
                
                for line in lines:
                    # Padrão para coordenadas (latitude e longitude)
                    # Ex: -5.123456 -42.123456 ou 5°12'34"S 42°12'34"W
                    coord_pattern = r'(-?\d+[.,]\d+)\s+(-?\d+[.,]\d+)'
                    coords = re.search(coord_pattern, line)
                    
                    if coords:
                        # Extrair o nome do município (geralmente no início da linha)
                        # Remove números, coordenadas e outros caracteres especiais
                        nome_limpo = re.sub(r'[-\d.,°′″NSEW\s]+$', '', line).strip()
                        nome_limpo = re.sub(r'^\d+\s*', '', nome_limpo).strip()  # Remove números iniciais
                        
                        if len(nome_limpo) > 2:  # Nome válido
                            lat = float(coords.group(1).replace(',', '.'))
                            lng = float(coords.group(2).replace(',', '.'))
                            
                            municipio = {
                                "nome": nome_limpo.upper(),
                                "latitude": lat,
                                "longitude": lng,
                                "fonte_linha": line.strip()
                            }
                            
                            municipios.append(municipio)
                            print(f"✅ {nome_limpo}: {lat}, {lng}")
    
    except Exception as e:
        print(f"❌ Erro ao processar PDF: {e}")
        return None
    
    return municipios

def extrair_coordenadas_com_pypdf2():
    """Método alternativo usando PyPDF2"""
    try:
        import PyPDF2
    except ImportError:
        print("❌ PyPDF2 não instalado. Execute: pip install PyPDF2")
        return None
    
    pdf_path = Path("../latitudelongitude.pdf")
    if not pdf_path.exists():
        pdf_path = Path("latitudelongitude.pdf")
    
    municipios = []
    
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            print(f"📄 PDF aberto com {len(pdf_reader.pages)} páginas")
            
            for page_num, page in enumerate(pdf_reader.pages):
                print(f"📖 Processando página {page_num + 1}...")
                text = page.extract_text()
                
                if not text:
                    continue
                
                lines = text.split('\n')
                
                for line in lines:
                    # Padrão para coordenadas
                    coord_pattern = r'(-?\d+[.,]\d+)\s+(-?\d+[.,]\d+)'
                    coords = re.search(coord_pattern, line)
                    
                    if coords:
                        nome_limpo = re.sub(r'[-\d.,°′″NSEW\s]+$', '', line).strip()
                        nome_limpo = re.sub(r'^\d+\s*', '', nome_limpo).strip()
                        
                        if len(nome_limpo) > 2:
                            lat = float(coords.group(1).replace(',', '.'))
                            lng = float(coords.group(2).replace(',', '.'))
                            
                            municipio = {
                                "nome": nome_limpo.upper(),
                                "latitude": lat,
                                "longitude": lng,
                                "fonte_linha": line.strip()
                            }
                            
                            municipios.append(municipio)
                            print(f"✅ {nome_limpo}: {lat}, {lng}")
    
    except Exception as e:
        print(f"❌ Erro ao processar PDF: {e}")
        return None
    
    return municipios

def salvar_json(municipios, arquivo_saida="municipios_piaui_coordenadas.json"):
    """Salva os dados em JSON"""
    if not municipios:
        print("❌ Nenhum dado para salvar")
        return False
    
    # Remover duplicatas baseado no nome
    municipios_unicos = {}
    for municipio in municipios:
        nome = municipio["nome"]
        if nome not in municipios_unicos:
            municipios_unicos[nome] = municipio
    
    dados_finais = {
        "estado": "PIAUÍ",
        "total_municipios": len(municipios_unicos),
        "fonte": "latitudelongitude.pdf",
        "data_extracao": "2024-12-19",
        "municipios": list(municipios_unicos.values())
    }
    
    try:
        with open(arquivo_saida, 'w', encoding='utf-8') as f:
            json.dump(dados_finais, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Arquivo salvo: {arquivo_saida}")
        print(f"📊 Total de municípios: {len(municipios_unicos)}")
        return True
    
    except Exception as e:
        print(f"❌ Erro ao salvar JSON: {e}")
        return False

def main():
    print("🗺️ === EXTRATOR DE COORDENADAS DOS MUNICÍPIOS DO PIAUÍ ===")
    
    # Tentar primeiro com pdfplumber (mais preciso)
    municipios = extrair_coordenadas_com_pdfplumber()
    
    # Se falhar, tentar com PyPDF2
    if not municipios:
        print("🔄 Tentando método alternativo...")
        municipios = extrair_coordenadas_com_pypdf2()
    
    if municipios:
        salvar_json(municipios)
        
        # Mostrar alguns exemplos
        print("\n📋 Primeiros 5 municípios extraídos:")
        for i, municipio in enumerate(municipios[:5]):
            print(f"{i+1}. {municipio['nome']}: {municipio['latitude']}, {municipio['longitude']}")
    else:
        print("❌ Falha na extração. Verifique se o PDF está no local correto.")

if __name__ == "__main__":
    main() 