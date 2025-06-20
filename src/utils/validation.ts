import * as Yup from 'yup';

// CPF validation helper
export const isValidCPF = (cpf: string): boolean => {
  // Remove special characters
  cpf = cpf.replace(/[^\d]/g, '');
  
  // Check length
  if (cpf.length !== 11) return false;
  
  // Check for all same digits
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Validation algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cpf.charAt(9)) !== digit1) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(cpf.charAt(10)) === digit2;
};

// User Login Schema
export const loginSchema = Yup.object({
  email: Yup.string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  password: Yup.string()
    .required('Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
});

// Patient Basic Information Schema
export const patientBasicSchema = Yup.object({
  name: Yup.string()
    .required('Nome é obrigatório')
    .min(5, 'Nome deve ter pelo menos 5 caracteres'),
  cpf: Yup.string()
    .required('CPF é obrigatório')
    .test('valid-cpf', 'CPF inválido', isValidCPF),
  birthDate: Yup.date()
    .required('Data de nascimento é obrigatória')
    .max(new Date(), 'Data de nascimento não pode ser no futuro'),
  gender: Yup.string()
    .required('Gênero é obrigatório')
    .oneOf(['M', 'F', 'Outro'], 'Selecione uma opção válida')
});

// Patient Address Schema
export const patientAddressSchema = Yup.object({
  street: Yup.string().required('Rua é obrigatória'),
  number: Yup.string().required('Número é obrigatório'),
  complement: Yup.string(),
  neighborhood: Yup.string().required('Bairro é obrigatório'),
  city: Yup.string().required('Cidade é obrigatória'),
  state: Yup.string().required('Estado é obrigatório').length(2, 'Use a sigla do estado'),
  zipCode: Yup.string().required('CEP é obrigatório').matches(/^\d{5}-\d{3}$/, 'Formato inválido (00000-000)')
});

// Patient Contact Schema
export const patientContactSchema = Yup.object({
  phone: Yup.string().required('Telefone é obrigatório'),
  whatsapp: Yup.string(),
  email: Yup.string().email('Email inválido'),
  emergencyContact: Yup.string(),
  emergencyPhone: Yup.string()
});

// Patient Socioeconomic Schema
export const patientSocioeconomicSchema = Yup.object({
  education: Yup.string().required('Escolaridade é obrigatória'),
  income: Yup.string().required('Renda é obrigatória'),
  occupation: Yup.string(),
  familyMembers: Yup.number().required('Número de membros da família é obrigatório').min(1, 'Valor mínimo é 1'),
  housingSituation: Yup.string().required('Situação de moradia é obrigatória'),
  transportationAccess: Yup.boolean().required('Campo obrigatório'),
  governmentAssistance: Yup.boolean().required('Campo obrigatório'),
  governmentAssistanceType: Yup.string().when('governmentAssistance', {
    is: true,
    then: (schema) => schema.required('Tipo de assistência é obrigatório')
  })
});

// Patient Medical Info Schema
export const patientMedicalSchema = Yup.object({
  hasHealthInsurance: Yup.boolean().required('Campo obrigatório'),
  healthInsuranceName: Yup.string().when('hasHealthInsurance', {
    is: true,
    then: (schema) => schema.required('Nome do plano é obrigatório')
  }),
  previousEyeSurgery: Yup.boolean().required('Campo obrigatório'),
  previousEyeSurgeryDescription: Yup.string().when('previousEyeSurgery', {
    is: true,
    then: (schema) => schema.required('Descrição da cirurgia é obrigatória')
  }),
  chronicDiseases: Yup.array().of(Yup.string()),
  medications: Yup.array().of(Yup.string()),
  allergies: Yup.array().of(Yup.string()),
  visualAcuityRightEye: Yup.string(),
  visualAcuityLeftEye: Yup.string(),
  cataractType: Yup.string(),
  cataractEye: Yup.string().required('Olho com catarata é obrigatório')
}); 