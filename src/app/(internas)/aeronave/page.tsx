'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import toast from 'react-hot-toast';
import { Plane, PlusCircle, Search, Upload, Eye, Download, Wand2, Sparkles, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toPng } from 'html-to-image';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Title as ChartTitle,
} from 'chart.js';
import {
  TipoDespesaAeronave,
  adicionarAeronave,
  adicionarDespesaAeronave,
  adicionarPiloto,
  listarAeronaves,
  listarDespesasAeronave,
  listarPilotos,
  setDespesaReciboSmall,
  salvarReciboChunked,
  obterReciboChunked,
    listarTrechos,
    adicionarTrecho,
    listarPilotosWithIds,
    listarAeronavesWithIds,
    listarTrechosWithIds,
    updatePiloto,
    updateAeronave,
    updateTrecho,
    atualizarDespesaAeronave,
    deletarDespesaAeronave,
} from '@/services/aeronaveService';

type NullableString = string | undefined;

interface FormDespesa {
  data: string; // yyyy-MM-dd
  valor: string; // monetário como string para input controlado
  tipo: TipoDespesaAeronave | '';
  descricao: string;
  piloto: NullableString;
  aeronave: NullableString;
  reciboTexto: string;
  reciboFile?: File | null;
  reciboPreview?: string; // data url com prefixo para preview
    trecho?: NullableString;
}

interface FiltroRelatorio {
  inicio: string; // yyyy-MM-dd
  fim: string; // yyyy-MM-dd
  tipo: TipoDespesaAeronave | 'all';
  piloto: NullableString | 'all';
  aeronave: NullableString | 'all';
}

const tipos: { value: TipoDespesaAeronave; label: string }[] = [
  { value: 'combustivel', label: 'Combustível' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'hospedagens', label: 'Hospedagens' },
  { value: 'transportes', label: 'Transportes' },
];

export default function AeronavePage() {
  const [pilotos, setPilotos] = useState<string[]>([]);
  const [aeronaves, setAeronaves] = useState<string[]>([]);
  const [trechos, setTrechos] = useState<string[]>([]);
  const [addingPilot, setAddingPilot] = useState<boolean>(false);
  const [addingAircraft, setAddingAircraft] = useState<boolean>(false);
  const [addingTrecho, setAddingTrecho] = useState<boolean>(false);
  const [novoPiloto, setNovoPiloto] = useState<string>('');
  const [novaAeronave, setNovaAeronave] = useState<string>('');
  const [novoTrecho, setNovoTrecho] = useState<string>('');

  const [form, setForm] = useState<FormDespesa>({
    data: '',
    valor: '',
    tipo: '',
    descricao: '',
    piloto: undefined,
    aeronave: undefined,
    reciboTexto: '',
    reciboFile: null,
    reciboPreview: undefined,
    trecho: undefined,
  });

  const [filtro, setFiltro] = useState<FiltroRelatorio>({
    inicio: '',
    fim: '',
    tipo: 'all',
    piloto: 'all',
    aeronave: 'all',
  });

  const [carregandoRelatorio, setCarregandoRelatorio] = useState<boolean>(false);
  const [carregandoPrestacao, setCarregandoPrestacao] = useState<boolean>(false);
  const [linhas, setLinhas] = useState<
    Array<{
      id: string;
      dataISO: string;
      tipo: string;
      valor: number;
      piloto?: string;
      aeronave?: string;
      trecho?: string;
      descricao?: string;
      reciboTexto?: string;
      reciboMimeType?: 'image/jpeg' | 'image/png' | 'application/pdf';
      reciboImagemBase64?: string;
      reciboChunked?: boolean;
      statusReembolso?: 'pendente' | 'enviado' | 'aprovado' | 'pago';
    }>
  >([]);

  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>(undefined);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | undefined>(undefined);
  const previewRef = React.useRef<HTMLDivElement | null>(null);
  const [ocrRunning, setOcrRunning] = useState<boolean>(false);
  const [smartHints, setSmartHints] = useState<string[]>([]);
  const [prestacaoStatus, setPrestacaoStatus] = useState<'all' | 'pendente' | 'enviado' | 'aprovado' | 'pago'>('all');
  const [prestacaoInicio, setPrestacaoInicio] = useState<string>('');
  const [prestacaoFim, setPrestacaoFim] = useState<string>('');
  const [prestacaoPiloto, setPrestacaoPiloto] = useState<string>('all');
  const [prestacaoTrecho, setPrestacaoTrecho] = useState<string>('all');
  const [tab, setTab] = useState<'inclusao' | 'relatorio' | 'prestacao'>('inclusao');

  const [pilotosDocs, setPilotosDocs] = useState<Array<{ id: string; nome: string }>>([]);
  const [aeronavesDocs, setAeronavesDocs] = useState<Array<{ id: string; nome: string }>>([]);
  const [trechosDocs, setTrechosDocs] = useState<Array<{ id: string; nome: string }>>([]);
  const [editModal, setEditModal] = useState<{ type: 'piloto' | 'aeronave' | 'trecho' | null; id?: string; name: string }>({ type: null, name: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ valor: string; tipo: string; descricao: string; piloto?: string; aeronave?: string; trecho?: string }>({ valor: '', tipo: '', descricao: '' });

  function startEditRow(l: { id: string; valor: number; tipo: string; descricao?: string; piloto?: string; aeronave?: string; trecho?: string }) {
    setEditingId(l.id);
    setEditDraft({
      valor: l.valor.toFixed(2).replace('.', ','),
      tipo: l.tipo,
      descricao: l.descricao || '',
      piloto: l.piloto,
      aeronave: l.aeronave,
      trecho: l.trecho,
    });
  }

  function cancelEditRow() {
    setEditingId(null);
    setEditDraft({ valor: '', tipo: '', descricao: '' });
  }

  async function saveEditRow() {
    if (!editingId) return;
    try {
      const valorNumber = editDraft.valor ? Number(editDraft.valor.replace(/\./g, '').replace(',', '.')) : undefined;
      await atualizarDespesaAeronave(editingId, {
        valor: typeof valorNumber === 'number' && !Number.isNaN(valorNumber) ? valorNumber : undefined,
        tipo: (editDraft.tipo as any) || undefined,
        descricao: editDraft.descricao,
        piloto: editDraft.piloto,
        aeronave: editDraft.aeronave,
        trecho: editDraft.trecho,
      });
      toast.success('Despesa atualizada');
      setEditingId(null);
      await handleBuscarRelatorio();
    } catch (e) {
      console.error(e);
      toast.error('Falha ao salvar edição');
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const [pilotosList, aeronavesList, trechosList, pDocs, aDocs, tDocs] = await Promise.all([
          listarPilotos(),
          listarAeronaves(),
          listarTrechos(),
          listarPilotosWithIds(),
          listarAeronavesWithIds(),
          listarTrechosWithIds(),
        ]);
        setPilotos(pilotosList);
        setAeronaves(aeronavesList);
        setTrechos(trechosList);
        setPilotosDocs(pDocs);
        setAeronavesDocs(aDocs);
        setTrechosDocs(tDocs);
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, []);

  // Restaurar status de prestação salvo e observar mudanças
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aeronavePrestacaoStatus');
      if (saved === 'all' || saved === 'pendente' || saved === 'enviado' || saved === 'aprovado' || saved === 'pago') {
        setPrestacaoStatus(saved as any);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('aeronavePrestacaoStatus', prestacaoStatus);
    } catch {}
  }, [prestacaoStatus]);

  // Carregar automaticamente a prestação ao abrir a aba
  useEffect(() => {
    if (tab === 'prestacao') {
      handleBuscarPrestacao();
    }
  }, [tab]);

  const total = useMemo(() => {
    return linhas.reduce((acc, cur) => acc + (cur.valor || 0), 0);
  }, [linhas]);

  // Registro global do Chart.js (feito uma vez)
  ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, ChartTooltip, ChartLegend, ChartTitle);

  // Agregações para dashboard
  const aggregate = useCallback(
    (getter: (l: typeof linhas[number]) => string | undefined, limit?: number): { labels: string[]; values: number[] } => {
      const map = new Map<string, number>();
      linhas.forEach((l) => {
        const key = (getter(l) || 'Não informado').trim();
        map.set(key, (map.get(key) || 0) + (l.valor || 0));
      });
      const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
      const sliced = typeof limit === 'number' ? entries.slice(0, limit) : entries;
      return { labels: sliced.map(([k]) => k), values: sliced.map(([, v]) => v) };
    },
    [linhas]
  );

  const aggTipo = useMemo(() => aggregate((l) => l.tipo), [aggregate]);
  const aggPiloto = useMemo(() => aggregate((l) => l.piloto), [aggregate]);
  const aggAeronave = useMemo(() => aggregate((l) => l.aeronave), [aggregate]);
  const aggTrecho = useMemo(() => aggregate((l) => l.trecho), [aggregate]);

  const palette = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a78bfa', '#10b981', '#fb7185', '#94a3b8'];
  const toPieData = (agg: { labels: string[]; values: number[] }) => ({
    labels: agg.labels,
    datasets: [
      {
        data: agg.values.map((v) => Number(v.toFixed(2))),
        backgroundColor: agg.labels.map((_, i) => palette[i % palette.length]),
        borderWidth: 0,
      },
    ],
  });
  const toBarData = (agg: { labels: string[]; values: number[] }) => ({
    labels: agg.labels,
    datasets: [
      {
        label: 'Valor (R$)',
        data: agg.values.map((v) => Number(v.toFixed(2))),
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
    ],
  });
  const barOpts: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { callback: (v: any) => v } } },
  };
  const pieOpts: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  function resetForm() {
    setForm({
      data: '',
      valor: '',
      tipo: '',
      descricao: '',
      piloto: undefined,
      aeronave: undefined,
      trecho: undefined,
      reciboTexto: '',
      reciboFile: null,
      reciboPreview: undefined,
    });
    setSmartHints([]);
    setPreviewContent('');
    setPreviewImageUrl(undefined);
    setPreviewPdfUrl(undefined);
    setAddingPilot(false);
    setAddingAircraft(false);
    setAddingTrecho(false);
  }

  async function runSmartOcr(dataUrl: string, mime: string): Promise<string> {
    let imageDataUrl = dataUrl;
    try {
      if (mime === 'application/pdf') {
        imageDataUrl = await renderPdfFirstPageToDataUrl(dataUrl);
      }
    } catch (e) {
      console.warn('Falha ao rasterizar PDF, seguindo com dataUrl original:', e);
    }

    try {
      // Tentar importar normalmente
      const mod: any = (await import('tesseract.js')) as any;
      const T = (mod && (mod.default || mod)) as any;
      const result = await T.recognize(imageDataUrl, 'por');
      return result?.data?.text || '';
    } catch (e1) {
      // Fallback para bundle minificado
      try {
        const mod2: any = (await import('tesseract.js/dist/tesseract.min.js')) as any;
        const T2 = (mod2 && (mod2.default || mod2)) as any;
        const result2 = await T2.recognize(imageDataUrl, 'por');
        return result2?.data?.text || '';
      } catch (e2) {
        console.error('Falha para carregar Tesseract.js:', e1, e2);
        throw e2;
      }
    }
  }

  async function renderPdfFirstPageToDataUrl(pdfDataUrl: string): Promise<string> {
    const version = '4.6.82';
    const pdfjsLib = await loadPdfJsFromCdn(version);
    const base64 = pdfDataUrl.split(',')[1] || '';
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context not available');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/png');
  }

  function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) return resolve();
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  async function loadPdfJsFromCdn(version: string): Promise<any> {
    // Carrega pdf.min.js e pdf.worker.min.js do CDN no navegador
    if (typeof window === 'undefined') throw new Error('PDF.js só no cliente');
    const w = window as unknown as { pdfjsLib?: any };
    if (w.pdfjsLib) return w.pdfjsLib;
    const base = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}`;
    await loadScript(`${base}/pdf.min.js`);
    // worker será resolvido automaticamente pelo próprio pdf.min.js apontando para o mesmo CDN
    return (window as unknown as { pdfjsLib: any }).pdfjsLib;
  }

  function applySmartExtraction(rawText: string) {
    const raw = rawText || '';
    const lowered = raw.toLowerCase();

    // Classificação por palavras-chave mais rica
    let tipoInferido: TipoDespesaAeronave | undefined;
    const hints: string[] = [];
    if (/(posto|gasolina|etanol|diesel|combust[ií]vel|bomba|litro|etanol hidratado)/.test(lowered)) {
      tipoInferido = 'combustivel';
      hints.push('Detectado contexto de combustível');
    } else if (/(hotel|hospedagem|pousada|di[aá]ria|check-in|check out|apartamento|su[ií]te)/.test(lowered)) {
      tipoInferido = 'hospedagens';
      hints.push('Detectado contexto de hospedagem');
    } else if (/(restaurante|almo[cç]o|janta|lanche|refei[cç][aã]o|gar[cç]om|couvert|gorjeta)/.test(lowered)) {
      tipoInferido = 'alimentacao';
      hints.push('Detectado contexto de alimentação');
    } else if (/(uber|t[áa]xi|transporte|passagem|ped[aá]gio|estacionamento|tarifa)/.test(lowered)) {
      tipoInferido = 'transportes';
      hints.push('Detectado contexto de transporte');
    } else if (/(manuten[cç][aã]o|oficina|pe[cç]a|revis[aã]o|mec[aâ]nico|servi[cç]o)/.test(lowered)) {
      tipoInferido = 'manutencao';
      hints.push('Detectado contexto de manutenção');
    }

    // Valor total prioritário: busca "Total", "valor a pagar", etc.
    let valorEncontrado: string | undefined = extractTotalValor(raw);
    if (valorEncontrado) hints.push('Valor total sugerido detectado');

    // Extração de CNPJ, data e hora (metadados úteis)
    const cnpjMatch = lowered.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/);
    if (cnpjMatch) hints.push(`CNPJ detectado: ${cnpjMatch[0]}`);
    const dataMatch = lowered.match(/\b([0-3]?\d)[\/\-]([01]?\d)[\/\-](\d{2,4})\b/);
    if (dataMatch) hints.push(`Data detectada: ${dataMatch[0]}`);
    const horaMatch = lowered.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
    if (horaMatch) hints.push(`Hora detectada: ${horaMatch[0]}`);

    // Para alimentação: se houver múltiplos itens, sugerir normalização (sem forçar)
    if (tipoInferido === 'alimentacao') {
      const linhas = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const itensSignificativos = linhas.filter((l) => /(x\s*\d|r\$\s*[0-9]+[\.,][0-9]{2})/.test(l.toLowerCase()));
      if (itensSignificativos.length >= 3) hints.push('Múltiplos itens detectados (conta detalhada)');
    }

    // Extrair possível nome do estabelecimento para descrição curta
    const descricaoCurta = extractMerchantName(raw) || '';

    setSmartHints(hints);

    const dataISO = extractDateISO(raw);

    setForm((s) => ({
      ...s,
      descricao: s.descricao || descricaoCurta,
      tipo: s.tipo || (tipoInferido as any) || '',
      valor: s.valor || (valorEncontrado ? String(Number(valorEncontrado).toFixed(2)).replace('.', ',') : ''),
      reciboTexto: s.reciboTexto || raw.trim(),
      data: s.data || dataISO || s.data,
    }));
    toast.success('Informações extraídas automaticamente do recibo');
  }

  function extractTotalValor(text: string): string | undefined {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const toNumberString = (s: string) => s.replace(/\./g, '').replace(',', '.');

    // 1) Preferir linhas com "total a pagar"
    for (const l of lines) {
      if (/total\s*a\s*pagar/i.test(l)) {
        const m = l.match(/([0-9]{1,3}(?:[\.,][0-9]{3})*[\.,][0-9]{2})/);
        if (m) return toNumberString(m[1]);
      }
    }

    // 2) Linhas com "valor total" ou "total:" (com ou sem R$)
    for (const l of lines) {
      if (/(valor\s*total|^\s*total\b)/i.test(l)) {
        const m = l.match(/([0-9]{1,3}(?:[\.,][0-9]{3})*[\.,][0-9]{2})/);
        if (m) return toNumberString(m[1]);
      }
    }

    // 3) Procura padrão com R$ em qualquer lugar
    const moneyWithSymbol = text.match(/r\$\s*([0-9]{1,3}(?:[\.,][0-9]{3})*[\.,][0-9]{2})/i);
    if (moneyWithSymbol) return toNumberString(moneyWithSymbol[1]);

    // 4) Fallback: pegar o maior valor decimal encontrado no texto
    const allMatches = Array.from(text.matchAll(/([0-9]{1,3}(?:[\.,][0-9]{3})*[\.,][0-9]{2})/g));
    if (allMatches.length) {
      let max = 0;
      for (const m of allMatches) {
        const n = parseFloat(toNumberString(m[1]));
        if (!Number.isNaN(n) && n > max) max = n;
      }
      if (max > 0) return String(max);
    }
    return undefined;
  }

  function extractDateISO(text: string): string | undefined {
    // Procura datas no formato dd/mm/aaaa, dd-mm-aaaa ou dd.mm.aaaa (aceita 2 ou 4 dígitos de ano)
    const dateRegex = /\b([0-3]?\d)[\/\-.]([01]?\d)[\/\-.](\d{2}|\d{4})\b/;
    const keywords = /(impresso\s*em|emiss[aã]o|\bdata\b)/i;

    const toISO = (d: string, m: string, y: string): string => {
      const day = d.padStart(2, '0');
      const month = m.padStart(2, '0');
      const year = y.length === 2 ? (Number(y) >= 50 ? `19${y}` : `20${y}`) : y;
      return `${year}-${month}-${day}`;
    };

    // 1) Priorizar linhas com palavras-chave
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!keywords.test(line)) continue;
      const same = line.match(dateRegex);
      if (same) return toISO(same[1], same[2], same[3]);
      // Tentar nas linhas vizinhas
      if (i + 1 < lines.length) {
        const next = lines[i + 1].match(dateRegex);
        if (next) return toISO(next[1], next[2], next[3]);
      }
      if (i - 1 >= 0) {
        const prev = lines[i - 1].match(dateRegex);
        if (prev) return toISO(prev[1], prev[2], prev[3]);
      }
    }

    // 2) Fallback: primeira data do texto
    const m = text.match(dateRegex);
    if (!m) return undefined;
    return toISO(m[1], m[2], m[3]);
  }

  function extractMerchantName(text: string): string | undefined {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.replace(/\s{2,}/g, ' ').trim())
      .filter(Boolean);

    // Palavras a evitar
    const banned = /(cnpj|cpf|ie|im|end|endereco|av\.|avenida|rua|logradouro|cep|comp|nº|total|valor|pagamento|tef|te\.|impresso|autoriz|cupom|nf\-|sat|ecf|coo|danfe|nfe|serie|item|qtd|vlr|un|desc|hora|data|codigo|cod)/i;

    // Se localizar CNPJ, tentar linha anterior como nome
    const cnpjIndex = lines.findIndex((l) => /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/.test(l));
    if (cnpjIndex > 0) {
      const candidate = lines[cnpjIndex - 1];
      if (candidate && !banned.test(candidate) && candidate.replace(/[^A-Za-z]/g, '').length >= 4) {
        return truncateTitle(candidate);
      }
    }

    // Caso contrário, pegar a primeira linha com mais letras que dígitos, sem palavras banidas
    for (const l of lines) {
      if (banned.test(l)) continue;
      const letters = (l.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || []).length;
      const digits = (l.match(/[0-9]/g) || []).length;
      if (letters >= 4 && letters > digits) {
        return truncateTitle(l);
      }
    }

    return undefined;
  }

  function truncateTitle(s: string): string {
    const t = s.replace(/\s{2,}/g, ' ').trim();
    return t.length > 80 ? t.slice(0, 80) : t;
  }

  async function handleAdicionarPiloto() {
    try {
      if (!novoPiloto.trim()) return;
      await adicionarPiloto(novoPiloto.trim());
      setNovoPiloto('');
      setAddingPilot(false);
      const lista = await listarPilotos();
      setPilotos(lista);
      toast.success('Piloto adicionado');
    } catch (err) {
      toast.error('Erro ao adicionar piloto');
    }
  }

  async function handleAdicionarAeronave() {
    try {
      if (!novaAeronave.trim()) return;
      await adicionarAeronave(novaAeronave.trim());
      setNovaAeronave('');
      setAddingAircraft(false);
      const lista = await listarAeronaves();
      setAeronaves(lista);
      toast.success('Aeronave adicionada');
    } catch (err) {
      toast.error('Erro ao adicionar aeronave');
    }
  }

  async function handleAdicionarTrecho() {
    try {
      if (!novoTrecho.trim()) return;
      await adicionarTrecho(novoTrecho.trim());
      setNovoTrecho('');
      setAddingTrecho(false);
      const lista = await listarTrechos();
      setTrechos(lista);
      toast.success('Trecho adicionado');
    } catch (err) {
      toast.error('Erro ao adicionar trecho');
    }
  }

  function openEditEntity(type: 'piloto' | 'aeronave' | 'trecho') {
    const currentName = type === 'piloto' ? form.piloto : type === 'aeronave' ? form.aeronave : form.trecho;
    if (!currentName) {
      toast.error('Selecione um item para editar');
      return;
    }
    const docs = type === 'piloto' ? pilotosDocs : type === 'aeronave' ? aeronavesDocs : trechosDocs;
    const found = docs.find((d) => d.nome === currentName);
    if (!found) {
      toast.error('Item não encontrado');
      return;
    }
    setEditModal({ type, id: found.id, name: found.nome });
  }

  async function saveEditEntity() {
    if (!editModal.type || !editModal.id) return;
    const newName = editModal.name.trim();
    if (!newName) {
      toast.error('Nome inválido');
      return;
    }
    try {
      if (editModal.type === 'piloto') {
        await updatePiloto(editModal.id, newName);
        setPilotosDocs(await listarPilotosWithIds());
        setPilotos(await listarPilotos());
        setForm((s) => ({ ...s, piloto: newName }));
      } else if (editModal.type === 'aeronave') {
        await updateAeronave(editModal.id, newName);
        setAeronavesDocs(await listarAeronavesWithIds());
        setAeronaves(await listarAeronaves());
        setForm((s) => ({ ...s, aeronave: newName }));
      } else if (editModal.type === 'trecho') {
        await updateTrecho(editModal.id, newName);
        setTrechosDocs(await listarTrechosWithIds());
        setTrechos(await listarTrechos());
        setForm((s) => ({ ...s, trecho: newName }));
      }
      toast.success('Atualizado');
      setEditModal({ type: null, name: '' });
    } catch (e) {
      console.error(e);
      toast.error('Falha ao atualizar');
    }
  }

  async function handleSalvarDespesa() {
    try {
      if (!form.data || !form.valor || !form.tipo) {
        toast.error('Preencha data, valor e tipo');
        return;
      }
      const valorNumber = Number(String(form.valor).replace(/\./g, '').replace(',', '.'));
      if (Number.isNaN(valorNumber) || valorNumber <= 0) {
        toast.error('Valor inválido');
        return;
      }

      // Preparar recibo como texto e/ou imagem base64 (armazenado como texto no Firestore)
      let reciboMimeType: 'image/jpeg' | 'image/png' | 'application/pdf' | undefined = undefined;
      let reciboImagemBase64: string | undefined = undefined;
      let reciboTamanhoBytes: number | undefined = undefined;

      if (form.reciboFile && form.reciboPreview) {
        const isPng = form.reciboFile.type === 'image/png';
        const isJpeg = form.reciboFile.type === 'image/jpeg' || form.reciboFile.type === 'image/jpg';
        const isPdf = form.reciboFile.type === 'application/pdf';
        if (isPng || isJpeg || isPdf) {
          reciboMimeType = isPdf ? 'application/pdf' : isPng ? 'image/png' : 'image/jpeg';
          // preview é um dataURL: data:<mime>;base64,XXXXX
          const base64NoPrefix = form.reciboPreview.split(',')[1] || '';
          reciboImagemBase64 = base64NoPrefix;
          reciboTamanhoBytes = form.reciboFile.size;
        }
      }

      const parsedDate = ((): Date | null => {
        const s = form.data;
        if (!s) return null;
        if (s.includes('-')) return new Date(`${s}T00:00:00`);
        if (s.includes('/')) {
          const [d, m, y] = s.split('/');
          return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`);
        }
        return new Date(s);
      })();
      if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
        toast.error('Data inválida');
        return;
      }

      const despesaId = await adicionarDespesaAeronave({
        data: parsedDate,
        valor: valorNumber,
        tipo: form.tipo as TipoDespesaAeronave,
        descricao: form.descricao || undefined,
        piloto: form.piloto || undefined,
        aeronave: form.aeronave || undefined,
        trecho: form.trecho || undefined,
        reciboTexto: form.reciboTexto || undefined,
      });

      // Persistência da imagem como texto (base64) com fallback para chunking (não bloqueia sucesso)
      try {
        if (reciboImagemBase64 && reciboMimeType && typeof reciboTamanhoBytes === 'number') {
          const maxInlineChars = 900_000; // margem abaixo de 1MiB
          if (reciboImagemBase64.length <= maxInlineChars) {
            await setDespesaReciboSmall(despesaId, reciboMimeType, reciboImagemBase64, reciboTamanhoBytes);
          } else {
            await salvarReciboChunked(despesaId, reciboMimeType, reciboImagemBase64);
          }
        }
      } catch (attachErr) {
        console.error('Falha ao anexar recibo à despesa', attachErr);
        toast.error('Despesa salva, mas houve falha ao anexar o recibo');
      }

      toast.success('Despesa registrada');
      resetForm();
      // Atualiza relatório se filtros cobrirem hoje
      if (linhas.length > 0) {
        await handleBuscarRelatorio();
      }
    } catch (err) {
      console.error('Erro ao salvar despesa:', err);
      toast.error('Erro ao salvar despesa');
    }
  }

  async function handleBuscarRelatorio() {
    try {
      setCarregandoRelatorio(true);
      const inicioDate = filtro.inicio ? new Date(filtro.inicio) : undefined;
      const fimDate = filtro.fim ? new Date(filtro.fim) : undefined;
      const list = await listarDespesasAeronave({
        inicio: inicioDate,
        fim: fimDate,
        tipo: filtro.tipo === 'all' ? undefined : (filtro.tipo as TipoDespesaAeronave),
        piloto: filtro.piloto === 'all' ? undefined : (filtro.piloto as string | undefined),
        aeronave: filtro.aeronave === 'all' ? undefined : (filtro.aeronave as string | undefined),
      });

      const mapped = list.map((d) => ({
        id: d.id,
        dataISO: d.data.toDate().toISOString().slice(0, 10),
        tipo: d.tipo,
        valor: d.valor,
        piloto: d.piloto,
        aeronave: d.aeronave,
        trecho: (d as any).trecho,
        descricao: d.descricao,
        reciboTexto: d.reciboTexto,
        reciboMimeType: (d as any).reciboMimeType,
        reciboImagemBase64: (d as any).reciboImagemBase64,
        reciboChunked: (d as any).reciboChunked,
      }));
      setLinhas(mapped);
    } catch (err) {
      toast.error('Erro ao carregar relatório');
    } finally {
      setCarregandoRelatorio(false);
    }
  }

  async function handleBuscarPrestacao() {
    try {
      setCarregandoPrestacao(true);
      const list = await listarDespesasAeronave({
        inicio: prestacaoInicio ? new Date(prestacaoInicio) : undefined,
        fim: prestacaoFim ? new Date(prestacaoFim) : undefined,
        piloto: prestacaoPiloto === 'all' ? undefined : prestacaoPiloto,
        trecho: prestacaoTrecho === 'all' ? undefined : prestacaoTrecho,
        statusReembolso: prestacaoStatus === 'all' ? undefined : (prestacaoStatus as any),
      } as any);
      const mapped = list.map((d) => ({
        id: d.id,
        dataISO: d.data.toDate().toISOString().slice(0, 10),
        tipo: d.tipo,
        valor: d.valor,
        piloto: d.piloto,
        aeronave: d.aeronave,
        trecho: (d as any).trecho,
        descricao: d.descricao,
        statusReembolso: (d as any).statusReembolso,
      }));
      setLinhas(mapped);
    } catch (e) {
      toast.error('Erro ao carregar prestação');
    } finally {
      setCarregandoPrestacao(false);
    }
  }

  async function handleDeletarDespesa(id: string) {
    try {
      await deletarDespesaAeronave(id);
      toast.success('Despesa excluída com sucesso');
      // Recarrega o relatório atual
      await handleBuscarRelatorio();
    } catch (err) {
      console.error('Erro ao deletar despesa:', err);
      toast.error('Erro ao excluir despesa');
    }
  }

  function renderStatusChip(status?: 'pendente' | 'enviado' | 'aprovado' | 'pago') {
    const label = status || 'pendente';
    const classes =
      label === 'pendente'
        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
        : label === 'enviado'
        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
        : label === 'aprovado'
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-gray-100 text-gray-700 border-gray-200';
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${classes}`}>{label}</span>
    );
  }

  async function exportRelatorioPDF() {
    const [{ default: jsPDF }, auto] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Relatório de Despesas - Aeronave', 14, 16);
    doc.setFontSize(10);
    const filtros = [
      filtro.inicio ? `Início: ${filtro.inicio}` : null,
      filtro.fim ? `Fim: ${filtro.fim}` : null,
      filtro.tipo !== 'all' ? `Tipo: ${filtro.tipo}` : null,
      filtro.piloto !== 'all' ? `Piloto: ${filtro.piloto}` : null,
      filtro.aeronave !== 'all' ? `Aeronave: ${filtro.aeronave}` : null,
    ]
      .filter(Boolean)
      .join('  |  ');
    if (filtros) doc.text(filtros, 14, 24);
    const rows = linhas.map((l) => [
      l.dataISO,
      tipos.find((t) => t.value === l.tipo)?.label || l.tipo,
      l.piloto || '-',
      l.aeronave || '-',
      l.trecho || '-',
      (l.descricao || '').slice(0, 80),
      l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ]);
    // @ts-ignore
    auto.default(doc, {
      head: [['Data', 'Tipo', 'Piloto', 'Aeronave', 'Trecho', 'Descrição', 'Valor (R$)']],
      body: rows,
      startY: filtros ? 30 : 22,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save('relatorio-aeronave.pdf');
  }

  async function exportPrestacaoPDF() {
    const [{ default: jsPDF }, auto] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Prestação de Contas - Aeronave', 14, 16);
    doc.setFontSize(10);
    const filtros = [
      prestacaoInicio ? `Início: ${prestacaoInicio}` : null,
      prestacaoFim ? `Fim: ${prestacaoFim}` : null,
      prestacaoStatus !== 'all' ? `Status: ${prestacaoStatus}` : null,
      prestacaoPiloto !== 'all' ? `Piloto: ${prestacaoPiloto}` : null,
      prestacaoTrecho !== 'all' ? `Trecho: ${prestacaoTrecho}` : null,
    ]
      .filter(Boolean)
      .join('  |  ');
    if (filtros) doc.text(filtros, 14, 24);
    const rows = linhas.map((l) => [
      l.dataISO,
      l.piloto || '-',
      l.trecho || '-',
      tipos.find((t) => t.value === l.tipo)?.label || l.tipo,
      (l.descricao || '').slice(0, 80),
      l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      l.statusReembolso || 'pendente',
    ]);
    // @ts-ignore
    auto.default(doc, {
      head: [['Data', 'Piloto', 'Trecho', 'Tipo', 'Descrição', 'Valor (R$)', 'Status']],
      body: rows,
      startY: filtros ? 30 : 22,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save('prestacao-aeronave.pdf');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-gray-700" />
          <h1 className="text-lg font-semibold text-gray-900">Aeronave</h1>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <TabsList>
          <TabsTrigger value="inclusao">Incluir Despesa</TabsTrigger>
          <TabsTrigger value="relatorio">Relatórios</TabsTrigger>
          <TabsTrigger value="prestacao">Prestação de Contas</TabsTrigger>
        </TabsList>

        <TabsContent value="inclusao" className="mt-4">
          <Card className="p-4 space-y-4">
            {smartHints.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded p-2">
                <div className="font-medium mb-1">Sugestões do OCR</div>
                <ul className="list-disc ml-4 space-y-0.5">
                  {smartHints.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm((s) => ({ ...s, data: e.target.value }))}
                />
              </div>
              <div>
                <Label>Valor</Label>
                <Input
                  placeholder="0,00"
                  value={form.valor}
                  onChange={(e) => setForm((s) => ({ ...s, valor: e.target.value }))}
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm((s) => ({ ...s, tipo: v as TipoDespesaAeronave }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  placeholder="Opcional"
                  value={form.descricao}
                  onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label>Piloto</Label>
                  <Button variant="ghost" size="sm" onClick={() => setAddingPilot((v) => !v)}>
                    <PlusCircle className="w-4 h-4 mr-1" /> Adicionar piloto
                  </Button>
                </div>
                <Select
                  value={form.piloto || ''}
                  onValueChange={(v) => setForm((s) => ({ ...s, piloto: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {pilotos.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={() => openEditEntity('piloto')}>Editar piloto</Button>
                </div>
                {addingPilot && (
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Nome do piloto"
                      value={novoPiloto}
                      onChange={(e) => setNovoPiloto(e.target.value)}
                    />
                    <Button onClick={handleAdicionarPiloto}>Salvar</Button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label>Aeronave</Label>
                  <Button variant="ghost" size="sm" onClick={() => setAddingAircraft((v) => !v)}>
                    <PlusCircle className="w-4 h-4 mr-1" /> Adicionar aeronave
                  </Button>
                </div>
                <Select
                  value={form.aeronave || ''}
                  onValueChange={(v) => setForm((s) => ({ ...s, aeronave: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {aeronaves.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={() => openEditEntity('aeronave')}>Editar aeronave</Button>
                </div>
                {addingAircraft && (
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Nome da aeronave"
                      value={novaAeronave}
                      onChange={(e) => setNovaAeronave(e.target.value)}
                    />
                    <Button onClick={handleAdicionarAeronave}>Salvar</Button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label>Trecho da Viagem</Label>
                  <Button variant="ghost" size="sm" onClick={() => setAddingTrecho((v) => !v)}>
                    <PlusCircle className="w-4 h-4 mr-1" /> Adicionar trecho
                  </Button>
                </div>
                <Select
                  value={form.trecho || ''}
                  onValueChange={(v) => setForm((s) => ({ ...s, trecho: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {trechos.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={() => openEditEntity('trecho')}>Editar trecho</Button>
                </div>
                {addingTrecho && (
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Ex.: Teresina ➝ São Raimundo Nonato"
                      value={novoTrecho}
                      onChange={(e) => setNovoTrecho(e.target.value)}
                    />
                    <Button onClick={handleAdicionarTrecho}>Salvar</Button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Recibo (texto)</Label>
              <Input
                placeholder="Cole aqui o conteúdo textual do recibo (ex.: 'Recibo nº 123, posto X, 45 litros...')"
                value={form.reciboTexto}
                onChange={(e) => setForm((s) => ({ ...s, reciboTexto: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label>Recibo (imagem opcional)</Label>
                  {ocrRunning && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      Processando...
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="file"
                    accept="image/png, image/jpeg, application/pdf"
                    disabled={ocrRunning}
                    onChange={async (e) => {
                      const file = e.target.files?.[0] || null;
                      if (!file) {
                        setForm((s) => ({ ...s, reciboFile: null, reciboPreview: undefined }));
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = async (ev) => {
                        const dataUrl = String(ev.target?.result || '');
                        setForm((s) => ({ ...s, reciboFile: file, reciboPreview: dataUrl }));
                        
                        // Executar OCR automaticamente após carregar o arquivo
                        try {
                          setOcrRunning(true);
                          const text = await runSmartOcr(dataUrl, file.type);
                          applySmartExtraction(text);
                        } catch (e) {
                          console.error(e);
                          toast.error('Falha no OCR automático');
                        } finally {
                          setOcrRunning(false);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  {form.reciboPreview && form.reciboFile && form.reciboFile.type.startsWith('image/') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={ocrRunning}
                      onClick={() => {
                        setPreviewContent('');
                        // mostra a imagem no modal também
                        setPreviewOpen(true);
                        setPreviewImageUrl(form.reciboPreview);
                        setPreviewPdfUrl(undefined);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" /> Pré-visualizar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  JPG/PNG/PDF. O arquivo será processado automaticamente com OCR para extrair informações. 
                  {ocrRunning && (
                    <span className="text-blue-600 font-medium"> Processando...</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                {ocrRunning && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Processando OCR...
                  </div>
                )}
                <Button
                  variant="outline"
                  type="button"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSalvarDespesa}>Salvar Despesa</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="relatorio" className="mt-4">
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label>Início</Label>
                <Input
                  type="date"
                  value={filtro.inicio}
                  onChange={(e) => setFiltro((s) => ({ ...s, inicio: e.target.value }))}
                />
              </div>
              <div>
                <Label>Fim</Label>
                <Input
                  type="date"
                  value={filtro.fim}
                  onChange={(e) => setFiltro((s) => ({ ...s, fim: e.target.value }))}
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={filtro.tipo}
                  onValueChange={(v) => setFiltro((s) => ({ ...s, tipo: v as FiltroRelatorio['tipo'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {tipos.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Piloto</Label>
                <Select
                  value={filtro.piloto || 'all'}
                  onValueChange={(v) => setFiltro((s) => ({ ...s, piloto: (v || 'all') as FiltroRelatorio['piloto'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {pilotos.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Aeronave</Label>
                <Select
                  value={filtro.aeronave || 'all'}
                  onValueChange={(v) => setFiltro((s) => ({ ...s, aeronave: (v || 'all') as FiltroRelatorio['aeronave'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {aeronaves.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="flex gap-2">
                <Button onClick={handleBuscarRelatorio} disabled={carregandoRelatorio}>
                  <Search className="w-4 h-4 mr-2" />
                  {carregandoRelatorio ? 'Carregando...' : 'Buscar'}
                </Button>
                <Button variant="outline" onClick={exportRelatorioPDF}>Exportar PDF</Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {/* Dashboard compacto */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border rounded-lg p-4 h-64 shadow-sm">
                  <div className="text-sm text-gray-600 mb-2">Por Tipo</div>
                  <Doughnut data={toPieData(aggTipo)} options={pieOpts} />
                </div>
                <div className="bg-white border rounded-lg p-4 h-64 shadow-sm">
                  <div className="text-sm text-gray-600 mb-2">Por Piloto</div>
                  <Bar data={toBarData(aggPiloto)} options={barOpts} />
                </div>
                <div className="bg-white border rounded-lg p-4 h-64 shadow-sm">
                  <div className="text-sm text-gray-600 mb-2">Por Aeronave</div>
                  <Bar data={toBarData(aggAeronave)} options={barOpts} />
                </div>
                <div className="bg-white border rounded-lg p-4 h-64 shadow-sm">
                  <div className="text-sm text-gray-600 mb-2">Por Trecho</div>
                  <Bar data={toBarData(aggTrecho)} options={barOpts} />
                </div>
              </div>

              <Table>
                <TableCaption>
                  {linhas.length} registro(s) • Total R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Piloto</TableHead>
                    <TableHead>Aeronave</TableHead>
                    <TableHead>Trecho</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Recibo</TableHead>
                    <TableHead className="text-right">Valor (R$)</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.dataISO}</TableCell>
                      <TableCell>
                        {editingId === l.id ? (
                          <Select value={editDraft.tipo} onValueChange={(v) => setEditDraft((s) => ({ ...s, tipo: v }))}>
                            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {tipos.map((t) => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          tipos.find((t) => t.value === l.tipo)?.label || l.tipo
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === l.id ? (
                          <Select value={editDraft.piloto || ''} onValueChange={(v) => setEditDraft((s) => ({ ...s, piloto: v }))}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {pilotos.map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          l.piloto || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === l.id ? (
                          <Select value={editDraft.aeronave || ''} onValueChange={(v) => setEditDraft((s) => ({ ...s, aeronave: v }))}>
                            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {aeronaves.map((a) => (
                                <SelectItem key={a} value={a}>{a}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          l.aeronave || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === l.id ? (
                          <Select value={editDraft.trecho || ''} onValueChange={(v) => setEditDraft((s) => ({ ...s, trecho: v }))}>
                            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {trechos.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          l.trecho || '-'
                        )}
                      </TableCell>
                      <TableCell className="max-w-[260px]" title={l.descricao}>
                        {editingId === l.id ? (
                          <Input value={editDraft.descricao} onChange={(e) => setEditDraft((s) => ({ ...s, descricao: e.target.value }))} />
                        ) : (
                          <span className="truncate block">{l.descricao || '-'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {l.reciboTexto ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          // Se houver texto, abre como texto
                          if (l.reciboTexto && !l.reciboImagemBase64 && !l.reciboChunked) {
                            setPreviewImageUrl(undefined);
                            setPreviewContent(l.reciboTexto);
                            setPreviewOpen(true);
                            return;
                          }

                          // Se já veio inline base64 pequeno
                          if (l.reciboImagemBase64 && l.reciboMimeType) {
                            const dataUrl = `data:${l.reciboMimeType};base64,${l.reciboImagemBase64}`;
                            setPreviewContent('');
                            if (l.reciboMimeType === 'application/pdf') {
                              setPreviewPdfUrl(dataUrl);
                              setPreviewImageUrl(undefined);
                            } else {
                              setPreviewImageUrl(dataUrl);
                              setPreviewPdfUrl(undefined);
                            }
                            setPreviewOpen(true);
                            return;
                          }

                          // Se for chunked, buscar e remontar
                          if (l.reciboChunked) {
                            try {
                              const base64Joined = await obterReciboChunked(l.id);
                              const mime = l.reciboMimeType || 'image/jpeg';
                              const dataUrl = `data:${mime};base64,${base64Joined}`;
                              setPreviewContent('');
                              if (mime === 'application/pdf') {
                                setPreviewPdfUrl(dataUrl);
                                setPreviewImageUrl(undefined);
                              } else {
                                setPreviewImageUrl(dataUrl);
                                setPreviewPdfUrl(undefined);
                              }
                              setPreviewOpen(true);
                              return;
                            } catch (e) {
                              toast.error('Não foi possível carregar o recibo');
                            }
                          }

                          // Fallback: mostrar texto se existir
                          setPreviewImageUrl(undefined);
                          setPreviewPdfUrl(undefined);
                          setPreviewContent(l.reciboTexto || '');
                          setPreviewOpen(true);
                        }}
                      >
                        Ver recibo
                      </Button>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === l.id ? (
                          <Input className="text-right" value={editDraft.valor} onChange={(e) => setEditDraft((s) => ({ ...s, valor: e.target.value }))} />
                        ) : (
                          l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === l.id ? (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEditRow}>Salvar</Button>
                            <Button size="sm" variant="outline" onClick={cancelEditRow}>Cancelar</Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEditRow(l)}>Editar</Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDeletarDespesa(l.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="prestacao" className="mt-4">
          <Card className="p-4 space-y-4">
            <div className="text-sm text-gray-700">Controle de reembolso: pilotos pagam durante a viagem e enviam comprovantes para reembolso.</div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <Label>Início</Label>
                <Input type="date" value={prestacaoInicio} onChange={(e) => setPrestacaoInicio(e.target.value)} />
              </div>
              <div>
                <Label>Fim</Label>
                <Input type="date" value={prestacaoFim} onChange={(e) => setPrestacaoFim(e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={prestacaoStatus} onValueChange={(v) => setPrestacaoStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="enviado">Enviado</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Piloto</Label>
                <Select value={prestacaoPiloto} onValueChange={(v) => setPrestacaoPiloto(v as any)}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {pilotos.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trecho</Label>
                <Select value={prestacaoTrecho} onValueChange={(v) => setPrestacaoTrecho(v as any)}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {trechos.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={handleBuscarPrestacao} disabled={carregandoPrestacao}>
                {carregandoPrestacao ? 'Carregando...' : 'Filtrar'}
              </Button>
              <Button variant="outline" onClick={exportPrestacaoPDF}>Exportar PDF</Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Piloto</TableHead>
                    <TableHead>Trecho</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor (R$)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((l) => (
                    <TableRow key={`p-${l.id}`}>
                      <TableCell>{l.dataISO}</TableCell>
                      <TableCell>{l.piloto || '-'}</TableCell>
                      <TableCell>{l.trecho || '-'}</TableCell>
                      <TableCell>{tipos.find((t) => t.value === l.tipo)?.label || l.tipo}</TableCell>
                      <TableCell className="max-w-[260px] truncate" title={l.descricao}>{l.descricao || '-'}</TableCell>
                      <TableCell className="text-right">{l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>{renderStatusChip(l.statusReembolso as any)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={async () => { await atualizarDespesaAeronave(l.id, { statusReembolso: 'aprovado' }); toast.success('Status atualizado'); handleBuscarPrestacao(); }}>Aprovar</Button>
                          <Button size="sm" variant="outline" onClick={async () => { await atualizarDespesaAeronave(l.id, { statusReembolso: 'pago' }); toast.success('Status atualizado'); handleBuscarPrestacao(); }}>Marcar pago</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Recibo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {previewImageUrl ? (
              <div className="flex justify-center">
                <img
                  ref={previewRef as any}
                  src={previewImageUrl}
                  alt="Recibo"
                  className="max-h-[480px] rounded border"
                />
              </div>
            ) : previewPdfUrl ? (
              <div className="h-[70vh]">
                <iframe src={previewPdfUrl} className="w-full h-full rounded border" title="Recibo PDF" />
              </div>
            ) : (
              <div ref={previewRef} className="bg-white p-4 border rounded text-sm leading-6 whitespace-pre-wrap">{previewContent}</div>
            )}
            <div className="flex justify-end gap-2">
              {previewPdfUrl && (
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = previewPdfUrl!;
                    link.download = `recibo-${Date.now()}.pdf`;
                    link.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" /> Baixar PDF
                </Button>
              )}
              <Button
                onClick={async () => {
                  try {
                    if (!previewRef.current) return;
                    const dataUrl = await toPng(previewRef.current, { cacheBust: true, pixelRatio: 2 });
                    const link = document.createElement('a');
                    link.download = `recibo-${Date.now()}.png`;
                    link.href = dataUrl;
                    link.click();
                  } catch (e) {
                    toast.error('Erro ao exportar imagem');
                  }
                }}
              >
                Exportar PNG
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editModal.type} onOpenChange={(v) => !v && setEditModal({ type: null, name: '' })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar {editModal.type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={editModal.name} onChange={(e) => setEditModal((s) => ({ ...s, name: e.target.value }))} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditModal({ type: null, name: '' })}>Cancelar</Button>
              <Button onClick={saveEditEntity}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


