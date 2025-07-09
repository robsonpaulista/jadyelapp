import PyPDF2
import json
import re
from pathlib import Path

def extrair_coordenadas():
    # Caminho do arquivo PDF
    pdf_path = Path(__file__).parent.parent / 'latitudelongitude.pdf'
    
    # Lista para armazenar os dados dos municípios
    municipios = []
    
    # Abrir o PDF
    with open(pdf_path, 'rb') as file:
        # Criar um objeto PDF
        pdf_reader = PyPDF2.PdfReader(file)
        
        # Para cada página
        for page in pdf_reader.pages:
            # Extrair texto
            texto = page.extract_text()
            
            # Dividir em linhas
            linhas = texto.split('\n')
            
            # Processar cada linha
            for linha in linhas:
                # Ignorar cabeçalho e linhas vazias
                if 'id_municipio' in linha or not linha.strip():
                    continue
                
                # Usar regex para extrair os dados
                # Padrão: ID UF NOME LONGITUDE LATITUDE NOME_CAPS
                match = re.match(r'(\d+)\s+PI\s+.*?\s+([-]?\d+\.\d+)\s+([-]?\d+\.\d+)\s+([A-ZÀ-Ÿ\s]+)$', linha.strip())
                
                if match:
                    try:
                        id_municipio = match.group(1)
                        longitude = float(match.group(2))
                        latitude = float(match.group(3))
                        nome = match.group(4).strip()
                        
                        # Validar coordenadas (Piauí está aproximadamente entre -2 e -11 lat, -40 e -46 long)
                        if -2 > latitude > -11 and -40 > longitude > -46:
                            municipio = {
                                'id': id_municipio,
                                'nome': nome,
                                'latitude': latitude,
                                'longitude': longitude
                            }
                            municipios.append(municipio)
                            print(f"Extraído: {municipio}")
                    except (ValueError, IndexError) as e:
                        print(f"Erro ao processar linha: {linha}")
                        print(f"Erro: {e}")
                        continue
    
    # Ordenar por nome
    municipios.sort(key=lambda x: x['nome'])
    
    # Salvar em JSON
    output_path = Path(__file__).parent.parent / 'public' / 'coordenadas_municipios.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'municipios': municipios,
            'total': len(municipios)
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\nTotal de municípios extraídos: {len(municipios)}")
    print(f"Dados salvos em: {output_path}")

if __name__ == '__main__':
    extrair_coordenadas() 