// Territórios de Desenvolvimento do Piauí
// Fonte: Governo do Estado do Piauí

export interface Territorio {
  nome: string;
  descricao: string;
  municipios: string[];
  cor: string;
}

export const TERRITORIOS_PIAUI: Territorio[] = [
  {
    nome: "Planície Litorânea",
    descricao: "Abrange a região costeira, com potencialidades em pesca, aquicultura e produção de leite e derivados.",
    cor: "#FF6B6B",
    municipios: [
      "Parnaíba", "Luís Correia", "Cajueiro da Praia", "Ilha Grande", "Bom Princípio do Piauí",
      "Caraúbas do Piauí", "Caxingó", "Cocal", "Cocal de Telha", "Cocal dos Alves",
      "Buriti dos Lopes", "Cajazeiras do Piauí", "Piripiri", "Piracuruca", "Campo Largo do Piauí",
      "João Costa", "Lagoa de São Francisco", "Morro do Chapéu do Piauí", "Murici dos Portelas",
      "São João da Fronteira", "São João do Arraial", "Matias Olímpio", "Miguel Alves",
      "Porto", "Barras", "Batalha", "Boa Hora", "Capitão de Campos", "Joca Marques",
      "Luzilândia", "Madeiro", "Milton Brandão", "Nossa Senhora dos Remédios", "União"
    ]
  },
  {
    nome: "Entre Rios",
    descricao: "Inclui a capital Teresina e tem potencial para turismo de negócios e eventos.",
    cor: "#4ECDC4",
    municipios: [
      "Teresina", "Altos", "Beneditinos", "Coivaras", "Curralinhos", "Demerval Lobão",
      "Lagoa Alegre", "Monsenhor Gil", "Nazária", "Palmeirais", "Passagem Franca do Piauí",
      "Prata do Piauí", "Sigefredo Pacheco", "Água Branca", "Alto Longá", "Agricolândia",
      "Miguel Leão", "Santa Cruz dos Milagres", "São João da Serra", "São Pedro do Piauí"
    ]
  },
  {
    nome: "Carnaubais",
    descricao: "Focado em produção de açúcar e álcool, além de ovinocaprinocultura.",
    cor: "#45B7D1",
    municipios: [
      "Campo Maior", "Castelo do Piauí", "José de Freitas", "Nossa Senhora de Nazaré",
      "Nova Santa Rita", "Pau D'Arco do Piauí", "Pedro II", "Pimenteiras", "Pio IX",
      "São João da Canabrava", "São Miguel do Tapuio", "Valença do Piauí", "Aroazes",
      "Juazeiro do Piauí", "Lagoa do Sítio", "Lagoinha do Piauí", "Santo Antônio de Lisboa",
      "Santo Antônio dos Milagres", "Santo Inácio do Piauí", "São Gonçalo do Piauí"
    ]
  },
  {
    nome: "Cocais",
    descricao: "Destaca-se pela piscicultura e ovinocaprinocultura.",
    cor: "#96CEB4",
    municipios: [
      "Picos", "Amarante", "Angical do Piauí", "Arraial", "Barro Duro", "Francisco Santos",
      "Hugo Napoleão", "Inhuma", "Ipiranga do Piauí", "Itainópolis", "Itaueira",
      "Jacobina do Piauí", "Jaicós", "Jardim do Mulato", "Jatobá do Piauí", "Jerumenha",
      "Joaquim Pires", "Landri Sales", "Olho D'Água do Piauí", "Padre Marcos",
      "Paquetá", "Patos do Piauí", "Paulistana", "Pavussu", "Pedro Laurentino",
      "Santa Cruz do Piauí", "São Francisco do Piauí", "São João da Varjota",
      "São José do Divino", "São José do Peixe", "São José do Piauí", "São Julião",
      "São Luis do Piauí", "São Miguel da Baixa Grande", "São Miguel do Fidalgo",
      "Tanque do Piauí", "Vila Nova do Piauí", "Wall Ferraz"
    ]
  },
  {
    nome: "Vale do Rio Sambito",
    descricao: "Focado em ovinocaprinocultura e fruticultura irrigada.",
    cor: "#FFEAA7",
    municipios: [
      "Piripiri", "Brasileira", "Buriti dos Montes", "Cabeceiras do Piauí", "Capitão Gervásio Oliveira",
      "Dom Expedito Lopes", "Elesbão Veloso", "Eliseu Martins", "Esperantina", "Fartura do Piauí",
      "Flores do Piauí", "Floresta do Piauí", "Francisco Ayres", "Francisco Macedo", "Fronteiras",
      "Geminiano", "Guaribas", "Isaías Coelho", "Regeneração", "Ribeira do Piauí",
      "Santa Rosa do Piauí", "Santana do Piauí", "São Braz do Piauí", "São Félix do Piauí",
      "São Gonçalo do Gurguéia", "São João do Piauí", "São Lourenço do Piauí", "Sussuapara"
    ]
  },
  {
    nome: "Vale do Rio Guaribas",
    descricao: "Destaca-se pela ovinocaprinocultura e apicultura.",
    cor: "#DDA0DD",
    municipios: [
      "Simplício Mendes", "Alagoinha do Piauí", "Alegrete do Piauí", "Alvorada do Gurguéia",
      "Anísio de Abreu", "Antônio Almeida", "Aroeiras do Itaim", "Assunção do Piauí",
      "Avelino Lopes", "Baixa Grande do Ribeiro", "Barra D'Alcântara", "Barreiras do Piauí",
      "Bela Vista do Piauí", "Belém do Piauí", "Bertolínia", "Betânia do Piauí",
      "Bocaina", "Bom Jesus", "Bonfim do Piauí", "Boqueirão do Piauí", "Brejo do Piauí",
      "Caldeirão Grande do Piauí", "Campinas do Piauí", "Campo Alegre do Fidalgo",
      "Campo Grande do Piauí", "Canavieira", "Canto do Buriti", "Caracol", "Caridade do Piauí",
      "Colônia do Gurguéia", "Colônia do Piauí", "Conceição do Canindé", "Coronel José Dias",
      "Cristalândia do Piauí", "Cristino Castro", "Curimatá", "Currais", "Curral Novo do Piauí",
      "Dirceu Arcoverde", "Dom Inocêncio", "Domingos Mourão", "João Costa", "Lagoa do Barro do Piauí",
      "Manoel Emídio", "Marcolândia", "Marcos Parente", "Massapê do Piauí", "Monte Alegre do Piauí",
      "Morro Cabeça no Tempo", "Nazaré do Piauí", "Novo Oriente do Piauí", "Novo Santo Antônio",
      "Oeiras", "Paes Landim", "Pajeú do Piauí", "Palmeira do Piauí", "Parnaguá",
      "Porto Alegre do Piauí", "Queimada Nova", "Redenção do Gurguéia", "Riacho Frio",
      "Ribeiro Gonçalves", "Rio Grande do Piauí", "Santa Filomena", "Santa Luz",
      "São Francisco de Assis do Piauí", "São João do Piauí", "São Lourenço do Piauí",
      "São Raimundo Nonato", "Sebastião Barros", "Sebastião Leal", "Simões", "Socorro do Piauí",
      "Tamboril do Piauí", "Várzea Branca", "Vera Mendes"
    ]
  },
  {
    nome: "Chapada do Vale do Rio Itaim",
    descricao: "Foco em ovinocaprinocultura e apicultura.",
    cor: "#98D8C8",
    municipios: [
      "Acauã", "Alvorada do Gurguéia", "Anísio de Abreu", "Avelino Lopes", "Baixa Grande do Ribeiro",
      "Barreiras do Piauí", "Bela Vista do Piauí", "Belém do Piauí", "Betânia do Piauí",
      "Bom Jesus", "Bonfim do Piauí", "Brejo do Piauí", "Canto do Buriti", "Caracol",
      "Colônia do Gurguéia", "Conceição do Canindé", "Coronel José Dias", "Cristalândia do Piauí",
      "Cristino Castro", "Curimatá", "Currais", "Dirceu Arcoverde", "Dom Inocêncio",
      "João Costa", "Lagoa do Barro do Piauí", "Manoel Emídio", "Monte Alegre do Piauí",
      "Morro Cabeça no Tempo", "Novo Santo Antônio", "Oeiras", "Palmeira do Piauí",
      "Parnaguá", "Porto Alegre do Piauí", "Queimada Nova", "Redenção do Gurguéia",
      "Riacho Frio", "Ribeiro Gonçalves", "Santa Filomena", "Santa Luz", "São Francisco de Assis do Piauí",
      "São João do Piauí", "São Lourenço do Piauí", "São Raimundo Nonato", "Sebastião Barros",
      "Sebastião Leal", "Tamboril do Piauí", "Várzea Branca"
    ]
  },
  {
    nome: "Vale do Canindé",
    descricao: "Destaca-se pela ovinocaprinocultura e apicultura.",
    cor: "#F7DC6F",
    municipios: [
      "Acauã", "Alvorada do Gurguéia", "Anísio de Abreu", "Avelino Lopes", "Baixa Grande do Ribeiro",
      "Barreiras do Piauí", "Bela Vista do Piauí", "Belém do Piauí", "Betânia do Piauí",
      "Bom Jesus", "Bonfim do Piauí", "Brejo do Piauí", "Canto do Buriti", "Caracol",
      "Colônia do Gurguéia", "Conceição do Canindé", "Coronel José Dias", "Cristalândia do Piauí",
      "Cristino Castro", "Curimatá", "Currais", "Dirceu Arcoverde", "Dom Inocêncio",
      "João Costa", "Lagoa do Barro do Piauí", "Manoel Emídio", "Monte Alegre do Piauí",
      "Morro Cabeça no Tempo", "Novo Santo Antônio", "Oeiras", "Palmeira do Piauí",
      "Parnaguá", "Porto Alegre do Piauí", "Queimada Nova", "Redenção do Gurguéia",
      "Riacho Frio", "Ribeiro Gonçalves", "Santa Filomena", "Santa Luz", "São Francisco de Assis do Piauí",
      "São João do Piauí", "São Lourenço do Piauí", "São Raimundo Nonato", "Sebastião Barros",
      "Sebastião Leal", "Tamboril do Piauí", "Várzea Branca"
    ]
  },
  {
    nome: "Serra da Capivara",
    descricao: "Foco em ovinocaprinocultura e apicultura.",
    cor: "#BB8FCE",
    municipios: [
      "São Raimundo Nonato", "Anísio de Abreu", "Bonfim do Piauí", "Brejo do Piauí",
      "Canto do Buriti", "Caracol", "Coronel José Dias", "Cristalândia do Piauí",
      "Cristino Castro", "Curimatá", "Dirceu Arcoverde", "Dom Inocêncio", "João Costa",
      "Lagoa do Barro do Piauí", "Manoel Emídio", "Monte Alegre do Piauí", "Morro Cabeça no Tempo",
      "Novo Santo Antônio", "Oeiras", "Palmeira do Piauí", "Parnaguá", "Porto Alegre do Piauí",
      "Queimada Nova", "Redenção do Gurguéia", "Riacho Frio", "Ribeiro Gonçalves",
      "Santa Filomena", "Santa Luz", "São Francisco de Assis do Piauí", "São João do Piauí",
      "São Lourenço do Piauí", "Sebastião Barros", "Sebastião Leal", "Tamboril do Piauí",
      "Várzea Branca"
    ]
  },
  {
    nome: "Vale dos Rios Piauí e Itaueiras",
    descricao: "Com potencial para fruticultura irrigada.",
    cor: "#85C1E9",
    municipios: [
      "Alagoinha do Piauí", "Alegrete do Piauí", "Alvorada do Gurguéia", "Anísio de Abreu",
      "Antônio Almeida", "Aroeiras do Itaim", "Assunção do Piauí", "Avelino Lopes",
      "Baixa Grande do Ribeiro", "Barra D'Alcântara", "Barreiras do Piauí", "Bela Vista do Piauí",
      "Belém do Piauí", "Bertolínia", "Betânia do Piauí", "Bocaina", "Bom Jesus",
      "Bonfim do Piauí", "Boqueirão do Piauí", "Brejo do Piauí", "Caldeirão Grande do Piauí",
      "Campinas do Piauí", "Campo Alegre do Fidalgo", "Campo Grande do Piauí", "Canavieira",
      "Canto do Buriti", "Caracol", "Caridade do Piauí", "Colônia do Gurguéia",
      "Colônia do Piauí", "Conceição do Canindé", "Coronel José Dias", "Cristalândia do Piauí",
      "Cristino Castro", "Curimatá", "Currais", "Curral Novo do Piauí", "Dirceu Arcoverde",
      "Dom Inocêncio", "Domingos Mourão", "João Costa", "Lagoa do Barro do Piauí",
      "Manoel Emídio", "Marcolândia", "Marcos Parente", "Massapê do Piauí", "Monte Alegre do Piauí",
      "Morro Cabeça no Tempo", "Nazaré do Piauí", "Novo Oriente do Piauí", "Novo Santo Antônio",
      "Oeiras", "Paes Landim", "Pajeú do Piauí", "Palmeira do Piauí", "Parnaguá",
      "Porto Alegre do Piauí", "Queimada Nova", "Redenção do Gurguéia", "Riacho Frio",
      "Ribeiro Gonçalves", "Rio Grande do Piauí", "Santa Filomena", "Santa Luz",
      "São Francisco de Assis do Piauí", "São João do Piauí", "São Lourenço do Piauí",
      "São Raimundo Nonato", "Sebastião Barros", "Sebastião Leal", "Simões", "Socorro do Piauí",
      "Tamboril do Piauí", "Várzea Branca", "Vera Mendes"
    ]
  },
  {
    nome: "Tabuleiros do Alto Parnaíba",
    descricao: "Focado em pecuária de corte e agricultura de alto rendimento.",
    cor: "#F8C471",
    municipios: [
      "Uruçuí", "Antônio Almeida", "Baixa Grande do Ribeiro", "Barreiras do Piauí",
      "Bela Vista do Piauí", "Belém do Piauí", "Bertolínia", "Bom Jesus", "Bonfim do Piauí",
      "Brejo do Piauí", "Canto do Buriti", "Caracol", "Colônia do Gurguéia", "Conceição do Canindé",
      "Coronel José Dias", "Cristalândia do Piauí", "Cristino Castro", "Curimatá",
      "Dirceu Arcoverde", "Dom Inocêncio", "João Costa", "Lagoa do Barro do Piauí",
      "Manoel Emídio", "Marcos Parente", "Monte Alegre do Piauí", "Morro Cabeça no Tempo",
      "Novo Santo Antônio", "Oeiras", "Palmeira do Piauí", "Parnaguá", "Porto Alegre do Piauí",
      "Queimada Nova", "Redenção do Gurguéia", "Riacho Frio", "Ribeiro Gonçalves",
      "Santa Filomena", "Santa Luz", "São Francisco de Assis do Piauí", "São João do Piauí",
      "São Lourenço do Piauí", "São Raimundo Nonato", "Sebastião Barros", "Sebastião Leal",
      "Tamboril do Piauí", "Várzea Branca"
    ]
  },
  {
    nome: "Chapada das Mangabeiras",
    descricao: "Foco em pecuária de corte e agricultura de alto rendimento (soja, algodão).",
    cor: "#82E0AA",
    municipios: [
      "Gilbués", "Alvorada do Gurguéia", "Anísio de Abreu", "Avelino Lopes", "Baixa Grande do Ribeiro",
      "Barreiras do Piauí", "Bela Vista do Piauí", "Belém do Piauí", "Betânia do Piauí",
      "Bom Jesus", "Bonfim do Piauí", "Brejo do Piauí", "Canto do Buriti", "Caracol",
      "Colônia do Gurguéia", "Conceição do Canindé", "Coronel José Dias", "Cristalândia do Piauí",
      "Cristino Castro", "Curimatá", "Currais", "Dirceu Arcoverde", "Dom Inocêncio",
      "João Costa", "Lagoa do Barro do Piauí", "Manoel Emídio", "Monte Alegre do Piauí",
      "Morro Cabeça no Tempo", "Novo Santo Antônio", "Oeiras", "Palmeira do Piauí",
      "Parnaguá", "Porto Alegre do Piauí", "Queimada Nova", "Redenção do Gurguéia",
      "Riacho Frio", "Ribeiro Gonçalves", "Santa Filomena", "Santa Luz", "São Francisco de Assis do Piauí",
      "São João do Piauí", "São Lourenço do Piauí", "São Raimundo Nonato", "Sebastião Barros",
      "Sebastião Leal", "Tamboril do Piauí", "Várzea Branca"
    ]
  }
];

// Função para encontrar o território de um município
export const encontrarTerritorio = (nomeMunicipio: string): Territorio | null => {
  const municipioNormalizado = nomeMunicipio.toLowerCase().trim();
  
  for (const territorio of TERRITORIOS_PIAUI) {
    const municipioEncontrado = territorio.municipios.find(
      municipio => municipio.toLowerCase().trim() === municipioNormalizado
    );
    
    if (municipioEncontrado) {
      return territorio;
    }
  }
  
  return null;
};

// Função para obter a cor de um território
export const obterCorTerritorio = (nomeMunicipio: string): string => {
  const territorio = encontrarTerritorio(nomeMunicipio);
  return territorio ? territorio.cor : "#CCCCCC"; // Cor padrão para municípios não encontrados
}; 