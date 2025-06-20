export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: string;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CampaignType {
  id: string;
  name: string;
  description?: string;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PersonAtendida {
  id: string;
  name: string;
  cpf: string;
  gender: 'M' | 'F' | 'Outro' | 'Não informado';
  birthDate: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contact: {
    phone: string;
    email?: string;
    whatsapp?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  };
  campaignId: string;
  createdAt: string;
  updatedAt?: string;
  income?: string;
  education?: string;
  occupation?: string;
  surgeryDate?: string;
  surgeryPerformedDate?: string;
  medicalInfo?: {
    hasHealthInsurance: boolean;
    healthInsuranceName?: string;
    previousEyeSurgery: boolean;
    previousEyeSurgeryDescription?: string;
    chronicDiseases: string[];
    medications: string[];
    allergies: string[];
    visualAcuityRightEye?: string;
    visualAcuityLeftEye?: string;
    cataractType?: 'Senil' | 'Traumática' | 'Congênita' | 'Secundária' | 'Outra';
    cataractEye: 'Direito' | 'Esquerdo' | 'Ambos';
    visualAcuityOD?: string;
    visualAcuityOS?: string;
    iop?: string;
    surgicalHistory?: string;
    surgeryTime?: string;
    surgeryLocation?: string;
    surgeryNotes?: string;
    postOpFollowUp?: string;
  };
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Contact {
  phone: string;
  whatsapp?: string;
  email?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface Socioeconomic {
  education: 'Nenhuma' | 'Fundamental' | 'Médio' | 'Superior' | 'Pós-graduação';
  income: 'Até 1 salário mínimo' | '1-3 salários mínimos' | '3-5 salários mínimos' | '5+ salários mínimos';
  occupation?: string;
  familyMembers: number;
  housingSituation: 'Própria' | 'Alugada' | 'Cedida' | 'Outra';
  transportationAccess: boolean;
  governmentAssistance: boolean;
  governmentAssistanceType?: string;
}

export interface MedicalInfo {
  hasHealthInsurance: boolean;
  healthInsuranceName?: string;
  previousEyeSurgery: boolean;
  previousEyeSurgeryDescription?: string;
  chronicDiseases: string[];
  medications: string[];
  allergies: string[];
  visualAcuityRightEye?: string;
  visualAcuityLeftEye?: string;
  cataractType?: 'Senil' | 'Traumática' | 'Congênita' | 'Secundária' | 'Outra';
  cataractEye: 'Direito' | 'Esquerdo' | 'Ambos';
  visualAcuityOD?: string;
  visualAcuityOS?: string;
  iop?: string;
  surgicalHistory?: string;
  surgeryDate?: string;
  surgeryTime?: string;
  surgeryLocation?: string;
  surgeryPerformedDate?: string;
  surgeryNotes?: string;
  postOpFollowUp?: string;
}

export interface UserAuth {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'attendant';
  phone?: string;
  department?: string;
  lastLogin?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserFormData {
  id?: string;
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: 'admin' | 'attendant';
  phone?: string;
  department?: string;
  active: boolean;
}

// Mantém a interface Patient como alias para PersonAtendida
export type Patient = PersonAtendida; 