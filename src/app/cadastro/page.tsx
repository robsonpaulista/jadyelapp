'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { v4 as uuidv4 } from 'uuid';
import { Patient, PersonAtendida } from '@/lib/types';
import { 
  savePatient, 
  getPatientById, 
  getAllCampaigns, 
  getAllCampaignTypes,
  isUserLoggedIn
} from '@/lib/storage';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Save, UserPlus, RefreshCw, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Interface para dados de pessoa
interface PessoaData {
  nome: string;
  cpf: string;
  dataNascimento: string;
  genero: string;
  endereco: string;
  numero: string;
  bairro: string;
  municipio: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  escolaridade?: string;
  rendaFamiliar?: string;
  observacoes?: string;
  dataAgendamento?: string;
  hora?: string;
  local?: string;
  dataDoAtendimento?: string;
  acaoId?: string;
  acaoTitulo?: string;
  isSubmitting?: boolean;
}

const MUNICIPIOS_PIAUI = [
  'Acauã', 'Agricolândia', 'Água Branca', 'Alagoinha do Piauí', 'Alegrete do Piauí', 'Alto Longá',
  'Altos', 'Alvorada do Gurguéia', 'Amarante', 'Angical do Piauí', 'Anísio de Abreu', 'Antônio Almeida',
  'Aroazes', 'Aroeiras do Itaim', 'Arraial', 'Assunção do Piauí', 'Avelino Lopes', 'Baixa Grande do Ribeiro',
  'Barra D\'Alcântara', 'Barras', 'Barreiras do Piauí', 'Barro Duro', 'Batalha', 'Bela Vista do Piauí',
  'Belém do Piauí', 'Beneditinos', 'Bertolínia', 'Betânia do Piauí', 'Boa Hora', 'Bocaina',
  'Bom Jesus', 'Bom Princípio do Piauí', 'Bonfim do Piauí', 'Boqueirão do Piauí', 'Brasileira',
  'Brejo do Piauí', 'Buriti dos Lopes', 'Buriti dos Montes', 'Cabeceiras do Piauí', 'Cajazeiras do Piauí',
  'Cajueiro da Praia', 'Caldeirão Grande do Piauí', 'Campinas do Piauí', 'Campo Alegre do Fidalgo',
  'Campo Grande do Piauí', 'Campo Largo do Piauí', 'Campo Maior', 'Canavieira', 'Canto do Buriti',
  'Capitão de Campos', 'Capitão Gervásio Oliveira', 'Caracol', 'Caraúbas do Piauí', 'Caridade do Piauí',
  'Castelo do Piauí', 'Caxingó', 'Cocal', 'Cocal de Telha', 'Cocal dos Alves', 'Coivaras',
  'Colônia do Gurguéia', 'Colônia do Piauí', 'Conceição do Canindé', 'Coronel José Dias',
  'Corrente', 'Cristalândia do Piauí', 'Cristino Castro', 'Curimatá', 'Currais', 'Curral Novo do Piauí',
  'Curralinhos', 'Demerval Lobão', 'Dirceu Arcoverde', 'Dom Expedito Lopes', 'Dom Inocêncio',
  'Domingos Mourão', 'Elesbão Veloso', 'Eliseu Martins', 'Esperantina', 'Fartura do Piauí',
  'Flores do Piauí', 'Floresta do Piauí', 'Francisco Ayres', 'Francisco Macedo', 'Francisco Santos',
  'Fronteiras', 'Geminiano', 'Gilbués', 'Guadalupe', 'Guaribas', 'Hugo Napoleão', 'Ilha Grande',
  'Inhuma', 'Ipiranga do Piauí', 'Isaías Coelho', 'Itainópolis', 'Itaueira', 'Jacobina do Piauí',
  'Jaicós', 'Jardim do Mulato', 'Jatobá do Piauí', 'Jerumenha', 'João Costa', 'Joaquim Pires',
  'Joca Marques', 'José de Freitas', 'Juazeiro do Piauí', 'Júlio Borges', 'Jurema', 'Lagoa Alegre',
  'Lagoa de São Francisco', 'Lagoa do Barro do Piauí', 'Lagoa do Piauí', 'Lagoa do Sítio',
  'Lagoinha do Piauí', 'Landri Sales', 'Luís Correia', 'Luzilândia', 'Madeiro', 'Manoel Emídio',
  'Marcolândia', 'Marcos Parente', 'Massapê do Piauí', 'Matias Olímpio', 'Miguel Alves',
  'Miguel Leão', 'Milton Brandão', 'Monsenhor Gil', 'Monsenhor Hipólito', 'Monte Alegre do Piauí',
  'Morro Cabeça no Tempo', 'Morro do Chapéu do Piauí', 'Murici dos Portelas', 'Nazaré do Piauí',
  'Nazária', 'Nossa Senhora de Nazaré', 'Nossa Senhora dos Remédios', 'Nova Santa Rita',
  'Novo Oriente do Piauí', 'Novo Santo Antônio', 'Oeiras', 'Olho D\'Água do Piauí', 'Padre Marcos',
  'Paes Landim', 'Pajeú do Piauí', 'Palmeira do Piauí', 'Palmeirais', 'Paquetá', 'Parnaguá',
  'Parnaíba', 'Passagem Franca do Piauí', 'Patos do Piauí', 'Pau D\'Arco do Piauí', 'Paulistana',
  'Pavussu', 'Pedro II', 'Pedro Laurentino', 'Picos', 'Pimenteiras', 'Pio IX', 'Piracuruca',
  'Piripiri', 'Porto', 'Porto Alegre do Piauí', 'Prata do Piauí', 'Queimada Nova',
  'Redenção do Gurguéia', 'Regeneração', 'Riacho Frio', 'Ribeira do Piauí', 'Ribeiro Gonçalves',
  'Rio Grande do Piauí', 'Santa Cruz do Piauí', 'Santa Cruz dos Milagres', 'Santa Filomena',
  'Santa Luz', 'Santa Rosa do Piauí', 'Santana do Piauí', 'Santo Antônio de Lisboa',
  'Santo Antônio dos Milagres', 'Santo Inácio do Piauí', 'São Braz do Piauí', 'São Félix do Piauí',
  'São Francisco de Assis do Piauí', 'São Francisco do Piauí', 'São Gonçalo do Gurguéia',
  'São Gonçalo do Piauí', 'São João da Canabrava', 'São João da Fronteira', 'São João da Serra',
  'São João da Varjota', 'São João do Arraial', 'São João do Piauí', 'São José do Divino',
  'São José do Peixe', 'São José do Piauí', 'São Julião', 'São Lourenço do Piauí', 'São Luis do Piauí',
  'São Miguel da Baixa Grande', 'São Miguel do Fidalgo', 'São Miguel do Tapuio', 'São Pedro do Piauí',
  'São Raimundo Nonato', 'Sebastião Barros', 'Sebastião Leal', 'Sigefredo Pacheco', 'Simões',
  'Simplício Mendes', 'Socorro do Piauí', 'Sussuapara', 'Tamboril do Piauí', 'Tanque do Piauí',
  'Teresina', 'União', 'Uruçuí', 'Valença do Piauí', 'Várzea Branca', 'Várzea Grande',
  'Vera Mendes', 'Vila Nova do Piauí', 'Wall Ferraz'
].sort();

// Funções de formatação
const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

const formatCEP = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
};

const formSchema = z.object({
  nome: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres'),
  cpf: z.string()
    .regex(/^\d+$/, 'Digite apenas números')
    .length(11, 'CPF deve ter exatamente 11 dígitos')
    .transform((cpf) => formatCPF(cpf)),
  dataNascimento: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data inválida'),
  genero: z.string().min(1, 'Gênero é obrigatório'),
  endereco: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  numero: z.string().min(1, 'Número é obrigatório'),
  bairro: z.string().min(3, 'Bairro deve ter pelo menos 3 caracteres'),
  municipio: z.string().min(3, 'Cidade deve ter pelo menos 3 caracteres'),
  estado: z.string().regex(/^[A-Z]{2}$/, 'Estado deve ser a sigla com 2 letras maiúsculas'),
  cep: z.string()
    .regex(/^\d+$/, 'Digite apenas números')
    .length(8, 'CEP deve ter exatamente 8 dígitos')
    .transform((cep) => formatCEP(cep)),
  telefone: z.string()
    .regex(/^\d+$/, 'Digite apenas números')
    .length(11, 'Telefone deve ter exatamente 11 dígitos (DDD + número)')
    .transform((telefone) => formatPhone(telefone)),
  email: z.string().email('E-mail inválido'),
  escolaridade: z.string().optional(),
  rendaFamiliar: z.string().optional(),
  observacoes: z.string().optional(),
  dataAgendamento: z.string().optional(),
  hora: z.string().optional(),
  local: z.string().optional(),
  dataDoAtendimento: z.string().optional(),
  isSubmitting: z.boolean().optional()
});

export default function CadastroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const campaignIdParam = searchParams.get('campaignId');
  
  const [isClient, setIsClient] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [campaignId, setCampaignId] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('pessoal');
  
  // Extrair os parâmetros da URL para a ação relacionada
  const acaoId = searchParams.get('acaoId');
  const acaoTitulo = searchParams.get('acaoTitulo');
  
  // Estado para os dados da pessoa
  const [formData, setFormData] = useState<PessoaData>({
    nome: '',
    cpf: '',
    dataNascimento: '',
    genero: 'Não informado',
    endereco: '',
    numero: '',
    bairro: '',
    municipio: '',
    estado: 'PI',
    cep: '',
    telefone: '',
    email: '',
    escolaridade: '',
    rendaFamiliar: '',
    observacoes: '',
    acaoId: acaoId || '',
    acaoTitulo: acaoTitulo || '',
    dataAgendamento: '',
    hora: '',
    local: '',
    dataDoAtendimento: '',
    isSubmitting: false
  });

  const form = useForm<PessoaData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      dataNascimento: '',
      genero: 'Não informado',
      endereco: '',
      numero: '',
      bairro: '',
      municipio: '',
      estado: 'PI',
      cep: '',
      telefone: '',
      email: '',
      escolaridade: '',
      rendaFamiliar: '',
      observacoes: '',
      dataAgendamento: '',
      hora: '',
      local: '',
      dataDoAtendimento: '',
      acaoId: acaoId || '',
      acaoTitulo: acaoTitulo || '',
      isSubmitting: false
    },
    mode: 'onChange'
  });

  useEffect(() => {
    setIsClient(true);
    
    // Carrega as campanhas
    const allCampaigns = getAllCampaigns();
    setCampaigns(allCampaigns);
    
    // Se tiver um ID para edição, carrega o paciente
    if (editId) {
      try {
        const patient = getPatientById(editId);
        if (patient) {
          setPatientToEdit(patient);
          
          // Garantir que todos os campos sejam preenchidos corretamente
          if (patient.campaignId) {
            setCampaignId(patient.campaignId);
          }
        } else {
          // Paciente não encontrado, redireciona para a lista
          alert('Paciente não encontrado');
          router.push('/pessoas');
        }
      } catch (error) {
        console.error('Erro ao carregar paciente:', error);
        alert('Erro ao carregar dados do paciente');
        router.push('/pessoas');
      }
    }
    
    // Se tiver um ID de campanha na URL, pré-seleciona
    else if (campaignIdParam) {
      setCampaignId(campaignIdParam);
    }
    
    setIsLoading(false);
  }, [router, editId, campaignIdParam]);

  // Valores iniciais para o formulário
  const initialValues = {
    name: patientToEdit?.name || '',
    cpf: patientToEdit?.cpf || '',
    birthDate: patientToEdit?.birthDate || '',
    gender: patientToEdit?.gender || '',
    
    // Endereço
    street: patientToEdit?.address?.street || '',
    number: patientToEdit?.address?.number || '',
    complement: patientToEdit?.address?.complement || '',
    neighborhood: patientToEdit?.address?.neighborhood || '',
    city: patientToEdit?.address?.city || '',
    state: patientToEdit?.address?.state || '',
    zipCode: patientToEdit?.address?.zipCode || '',
    
    // Contato
    phone: patientToEdit?.contact?.phone || '',
    email: patientToEdit?.contact?.email || '',
    whatsapp: patientToEdit?.contact?.whatsapp || '',
    emergencyContact: patientToEdit?.contact?.emergencyContact || '',
    emergencyPhone: patientToEdit?.contact?.emergencyPhone || '',
    
    // Dados socioeconômicos
    education: patientToEdit?.education || '',
    income: patientToEdit?.income || '',
    occupation: patientToEdit?.occupation || '',
    
    // Informações médicas
    hasHealthInsurance: patientToEdit?.medicalInfo?.hasHealthInsurance || false,
    healthInsuranceName: patientToEdit?.medicalInfo?.healthInsuranceName || '',
    previousEyeSurgery: patientToEdit?.medicalInfo?.previousEyeSurgery || false,
    previousEyeSurgeryDescription: patientToEdit?.medicalInfo?.previousEyeSurgeryDescription || '',
    chronicDiseases: patientToEdit?.medicalInfo?.chronicDiseases || [],
    medications: patientToEdit?.medicalInfo?.medications || [],
    allergies: patientToEdit?.medicalInfo?.allergies || [],
    visualAcuityRightEye: patientToEdit?.medicalInfo?.visualAcuityRightEye || '',
    visualAcuityLeftEye: patientToEdit?.medicalInfo?.visualAcuityLeftEye || '',
    cataractType: patientToEdit?.medicalInfo?.cataractType || '',
    cataractEye: patientToEdit?.medicalInfo?.cataractEye || '',
    visualAcuityOD: patientToEdit?.medicalInfo?.visualAcuityOD || '',
    visualAcuityOS: patientToEdit?.medicalInfo?.visualAcuityOS || '',
    iop: patientToEdit?.medicalInfo?.iop || '',
    surgicalHistory: patientToEdit?.medicalInfo?.surgicalHistory || '',
    
    // Dados de atendimento
    surgeryDate: patientToEdit?.surgeryDate || '',
    surgeryTime: patientToEdit?.medicalInfo?.surgeryTime || '',
    surgeryLocation: patientToEdit?.medicalInfo?.surgeryLocation || '',
    surgeryPerformedDate: patientToEdit?.surgeryPerformedDate || '',
    surgeryNotes: patientToEdit?.medicalInfo?.surgeryNotes || '',
    postOpFollowUp: patientToEdit?.medicalInfo?.postOpFollowUp || '',
    
    // Dados da campanha
    campaignId: patientToEdit?.campaignId || (campaigns.length > 0 ? campaigns[0].id : '')
  };

  // Função para simular o envio de mensagem via WhatsApp
  const simulateWhatsAppMessage = (phone: string, message: string) => {
    console.log(`📱 Simulando envio de WhatsApp para ${phone}: ${message}`);
    toast.success(`Mensagem WhatsApp enviada para ${phone}`);
  };

  // Função para simular o envio de SMS
  const sendSMS = (phoneNumber: string, patientName: string, surgeryInfo: { date?: string, time?: string, location?: string }) => {
    // Formatando o número de telefone para padrão brasileiro
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    
    // Garantindo que o número comece com o código do Brasil
    if (formattedPhone.length === 11) {
      formattedPhone = `+55${formattedPhone}`;
    } else if (formattedPhone.length === 10) {
      formattedPhone = `+55${formattedPhone}`;
    }
    
    // Montando a mensagem
    let message = `Olá ${patientName}, sua cirurgia foi registrada com sucesso.`;
    
    if (surgeryInfo.date || surgeryInfo.time || surgeryInfo.location) {
      message += " Detalhes:";
      if (surgeryInfo.date) message += ` Data: ${surgeryInfo.date}`;
      if (surgeryInfo.time) message += ` Horário: ${surgeryInfo.time}`;
      if (surgeryInfo.location) message += ` Local: ${surgeryInfo.location}`;
    }
    
    console.log(`Simulando envio de SMS para ${formattedPhone}: ${message}`);
    
    // Aqui você integraria com um serviço de SMS real
    // Por enquanto, apenas mostramos um alerta
    toast.success(`SMS enviado para ${formattedPhone}`);
    
    return true;
  };

  // Função para salvar os dados do paciente
  const onSubmit = async (data: PessoaData) => {
    try {
      form.setValue('isSubmitting', true);
      
      const pessoaData = {
        ...data,
        acaoId: acaoId || '',
        acaoTitulo: acaoTitulo || '',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };

      console.log('Dados a serem enviados:', pessoaData);

      const response = await fetch('/api/pessoas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pessoaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao cadastrar pessoa');
      }

      const result = await response.json();
      
      if (result.success) {
        // Mostrar mensagem de sucesso com mais detalhes
        toast.success(
          <div>
            <p className="font-bold">Pessoa registrada com sucesso!</p>
            <p className="text-sm">Nome: {data.nome}</p>
            {data.dataAgendamento && data.hora && (
              <p className="text-sm">
                Agendado para: {new Date(data.dataAgendamento).toLocaleDateString('pt-BR')} às {data.hora}
              </p>
            )}
          </div>,
          {
            duration: 5000, // 5 segundos
            position: 'top-right'
          }
        );

        // Aguarda um pouco para o usuário ver a mensagem antes de redirecionar
        setTimeout(() => {
          router.push('/acoes');
        }, 2000);
      } else {
        throw new Error(result.error || 'Erro ao cadastrar pessoa');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao cadastrar pessoa. Tente novamente.');
    } finally {
      form.setValue('isSubmitting', false);
    }
  };

  // Função para permitir apenas números nos campos
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof PessoaData) => {
    let value = e.target.value.replace(/\D/g, '');
    
    // Limita o tamanho do valor baseado no campo
    switch (fieldName) {
      case 'cpf':
        value = value.slice(0, 11);
        break;
      case 'telefone':
        value = value.slice(0, 11);
        break;
      case 'cep':
        value = value.slice(0, 8);
        break;
    }
    
    form.setValue(fieldName, value, {
      shouldValidate: true
    });
  };

  // Se ainda estiver carregando ou não estiver no cliente, mostra mensagem de carregamento
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold">
          {editId ? 'Editar Pessoa' : 'Cadastrar Nova Pessoa'}
        </h1>
      </div>

      {form.formState.errors && Object.keys(form.formState.errors).length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de validação</AlertTitle>
          <AlertDescription>
            Por favor, corrija os seguintes erros:
            <ul className="list-disc list-inside mt-2">
              {Object.entries(form.formState.errors).map(([field, error]) => (
                <li key={field}>
                  {field}: {error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  {...form.register('nome')}
                  placeholder="Nome completo"
                />
                {form.formState.errors.nome && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.nome.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  {...form.register('cpf')}
                  placeholder="Digite apenas os 11 números do CPF"
                  onChange={(e) => handleInputChange(e, 'cpf')}
                  maxLength={11}
                />
                {form.formState.errors.cpf && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.cpf.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                <Input
                  id="dataNascimento"
                  {...form.register('dataNascimento')}
                  placeholder="DD/MM/AAAA"
                />
                {form.formState.errors.dataNascimento && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.dataNascimento.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="genero">Gênero *</Label>
                <Select
                  onValueChange={(value) => form.setValue('genero', value)}
                  defaultValue={form.getValues('genero')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.genero && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.genero.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endereco">Rua *</Label>
                <Input
                  id="endereco"
                  {...form.register('endereco')}
                  placeholder="Nome da rua"
                />
                {form.formState.errors.endereco && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.endereco.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  {...form.register('numero')}
                  placeholder="Número"
                />
                {form.formState.errors.numero && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.numero.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  {...form.register('bairro')}
                  placeholder="Nome do bairro"
                />
                {form.formState.errors.bairro && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.bairro.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="municipio">Cidade *</Label>
                <Input
                  id="municipio"
                  {...form.register('municipio')}
                  placeholder="Nome da cidade"
                />
                {form.formState.errors.municipio && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.municipio.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="estado">Estado *</Label>
                <Input
                  id="estado"
                  {...form.register('estado')}
                  placeholder="Sigla do estado"
                />
                {form.formState.errors.estado && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.estado.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  {...form.register('cep')}
                  placeholder="Digite apenas os 8 números do CEP"
                  onChange={(e) => handleInputChange(e, 'cep')}
                  maxLength={8}
                />
                {form.formState.errors.cep && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.cep.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  {...form.register('telefone')}
                  placeholder="Digite DDD + número (apenas números)"
                  onChange={(e) => handleInputChange(e, 'telefone')}
                  maxLength={11}
                />
                {form.formState.errors.telefone && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.telefone.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  {...form.register('email')}
                  placeholder="exemplo@email.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="dataAgendamento">Data do Agendamento</Label>
                <Input
                  type="date"
                  id="dataAgendamento"
                  {...form.register('dataAgendamento')}
                />
                {form.formState.errors.dataAgendamento && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.dataAgendamento.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="hora">Hora</Label>
                <Input
                  type="time"
                  id="hora"
                  {...form.register('hora')}
                />
                {form.formState.errors.hora && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.hora.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="local">Local</Label>
                <Input
                  id="local"
                  {...form.register('local')}
                  placeholder="Local do atendimento"
                />
                {form.formState.errors.local && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.local.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="dataDoAtendimento">Data do Atendimento</Label>
                <Input
                  type="date"
                  id="dataDoAtendimento"
                  {...form.register('dataDoAtendimento')}
                />
                {form.formState.errors.dataDoAtendimento && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.dataDoAtendimento.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex items-center"
          >
            {form.formState.isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 