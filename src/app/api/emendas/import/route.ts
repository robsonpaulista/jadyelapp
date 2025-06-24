import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, setDoc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    // Ler o arquivo JSON das emendas
    const filePath = path.join(process.cwd(), 'emendas.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Arquivo emendas.json não encontrado' },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const emendasData = JSON.parse(fileContent);

    if (!Array.isArray(emendasData) || emendasData.length === 0) {
      return NextResponse.json(
        { error: 'Dados inválidos ou vazios no arquivo' },
        { status: 400 }
      );
    }

    // Usar batch para inserir múltiplos documentos de forma eficiente
    const batch = writeBatch(db);
    const emendasCollection = collection(db, 'emendas');

    let imported = 0;
    const errors = [];

    for (let i = 0; i < emendasData.length; i++) {
      try {
        const emenda = emendasData[i];
        
        // Limpar e normalizar os dados
        const normalizedEmenda = {
          bloco: emenda.BLOCO || null,
          emenda: emenda.Emenda || null,
          municipioBeneficiario: emenda['Município/Beneficiário'] || null,
          funcional: emenda.Funcional || null,
          gnd: emenda.GND || null,
          valorIndicado: typeof emenda['Valor Indicado'] === 'number' ? emenda['Valor Indicado'] : null,
          objeto: emenda.Objeto || null,
          alteracao: emenda.Alteração || null,
          numeroProposta: emenda['Nº da Proposta'] || null,
          valorEmpenhado: typeof emenda['Valor empenhado'] === 'number' ? emenda['Valor empenhado'] : null,
          empenho: emenda.Empenho || null,
          dataEmpenho: emenda['Data de Empenho'] || null,
          portariaConvenioContrato: emenda['Portaria/Convênio/Contrato de Repasse'] || null,
          valorAEmpenhar: typeof emenda['Valor a empenhar'] === 'number' ? emenda['Valor a empenhar'] : null,
          pagamento: emenda.Pagamento || null,
          valorPago: typeof emenda['Valor Pago'] === 'number' ? emenda['Valor Pago'] : null,
          valorASerPago: typeof emenda['Valor a ser Pago'] === 'number' ? emenda['Valor a ser Pago'] : null,
          liderancas: emenda.Lideranças || null,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Criar um documento com ID automático
        const docRef = doc(emendasCollection);
        batch.set(docRef, normalizedEmenda);
        imported++;

      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          data: emendasData[i]
        });
      }
    }

    // Executar o batch
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `${imported} emendas importadas com sucesso para o Firebase`,
      imported,
      total: emendasData.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Erro ao importar emendas:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para importar os dados das emendas',
    endpoint: '/api/emendas/import',
    method: 'POST'
  });
} 