export type CategoryGroup = {
  group: string;
  items: string[];
};

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    group: "Alimentação e Bebidas",
    items: [
      "Restaurante",
      "Lanchonete",
      "Fast Food",
      "Pizzaria",
      "Churrascaria",
      "Culinária Japonesa / Sushi",
      "Culinária Italiana",
      "Culinária Árabe",
      "Culinária Chinesa",
      "Culinária Mexicana",
      "Frutos do Mar",
      "Vegano / Vegetariano",
      "Padaria",
      "Confeitaria / Doces",
      "Cafeteria",
      "Sorveteria / Açaí",
      "Sucos e Vitaminas",
      "Bar / Pub",
      "Cervejaria / Brewpub",
      "Distribuidora de Bebidas",
      "Buffet e Eventos",
      "Food Truck",
      "Marmita / Refeição",
    ],
  },
  {
    group: "Comércio de Alimentos",
    items: [
      "Supermercado",
      "Mercearia / Mercadinho",
      "Hortifruti / Feira",
      "Açougue",
      "Peixaria",
      "Empório / Delicatessen",
      "Quitanda",
    ],
  },
  {
    group: "Saúde",
    items: [
      "Farmácia / Drogaria",
      "Clínica Médica",
      "Clínica Odontológica",
      "Clínica de Fisioterapia",
      "Clínica de Psicologia",
      "Clínica de Nutrição",
      "Laboratório de Análises",
      "Óptica",
      "Hospital / Pronto-Socorro",
      "Plano de Saúde",
      "Medicina Alternativa",
      "Home Care",
    ],
  },
  {
    group: "Bem-estar e Estética",
    items: [
      "Academia",
      "Pilates / Yoga",
      "Crossfit / Funcional",
      "Natação",
      "Artes Marciais",
      "Dança",
      "Spa",
      "Barbearia",
      "Salão de Beleza",
      "Manicure / Pedicure",
      "Estética Facial / Corporal",
      "Tatuagem / Piercing",
      "Massagem",
    ],
  },
  {
    group: "Educação",
    items: [
      "Escola / Colégio",
      "Faculdade / Universidade",
      "Curso de Idiomas",
      "Curso Profissionalizante",
      "Pré-vestibular / Cursinho",
      "Curso de Informática / TI",
      "Escola de Música",
      "Escola de Artes",
      "Escola de Esportes",
      "Reforço Escolar / Tutoria",
      "Creche / Educação Infantil",
      "Livraria",
      "Papelaria",
    ],
  },
  {
    group: "Moda e Acessórios",
    items: [
      "Moda Feminina",
      "Moda Masculina",
      "Moda Infantil",
      "Moda Íntima / Lingerie",
      "Calçados",
      "Bolsas e Acessórios",
      "Joalheria / Bijuteria",
      "Ótica / Óculos",
      "Brechó / Moda Sustentável",
      "Uniformes / Fardamentos",
      "Artigos Esportivos",
    ],
  },
  {
    group: "Casa e Construção",
    items: [
      "Móveis",
      "Decoração / Artesanato",
      "Colchões / Cama, Mesa e Banho",
      "Eletrodomésticos",
      "Eletroeletrônicos",
      "Material de Construção",
      "Ferragens / Ferramentas",
      "Tintas e Revestimentos",
      "Jardinagem / Paisagismo",
      "Piscinas / Saunas",
      "Cortinas / Persianas",
      "Iluminação",
      "Segurança Eletrônica / Câmeras",
      "Ar Condicionado / Climatização",
      "Dedetização / Controle de Pragas",
    ],
  },
  {
    group: "Serviços Automotivos",
    items: [
      "Mecânica Geral",
      "Funilaria e Pintura",
      "Elétrica Automotiva",
      "Pneus e Rodas",
      "Acessórios Automotivos",
      "Lava Rápido / Estética Automotiva",
      "Som e Multimídia Automotivo",
      "Moto Peças / Mecânica de Motos",
      "Concessionária / Revendedora",
      "Locação de Veículos",
    ],
  },
  {
    group: "Pets",
    items: [
      "Pet Shop",
      "Clínica Veterinária",
      "Hotel / Creche para Pets",
      "Banho e Tosa",
      "Adestramento",
      "Ração e Acessórios para Pets",
    ],
  },
  {
    group: "Tecnologia",
    items: [
      "Informática / Computadores",
      "Celulares / Smartphones",
      "Assistência Técnica (eletrônicos)",
      "Software / Desenvolvimento",
      "Segurança da Informação",
      "Jogos / Games",
      "Impressão 3D",
    ],
  },
  {
    group: "Serviços Profissionais",
    items: [
      "Advocacia / Jurídico",
      "Contabilidade / Fiscal",
      "Consultoria Empresarial",
      "Recursos Humanos / Recrutamento",
      "Agência de Marketing / Publicidade",
      "Gráfica / Impressão",
      "Fotografia / Filmagem",
      "Design Gráfico",
      "Arquitetura / Engenharia",
      "Corretora de Seguros",
      "Financeira / Crédito / Câmbio",
      "Imobiliária / Locação",
      "Despachante / Documentação",
      "Cartório / Tabelionato",
      "Agência de Viagens / Turismo",
    ],
  },
  {
    group: "Serviços para Casa",
    items: [
      "Reformas e Construção",
      "Instalações Hidráulicas",
      "Instalações Elétricas",
      "Chaveiro",
      "Limpeza Residencial / Comercial",
      "Lavanderia / Tinturaria",
      "Mudanças e Fretes",
      "Conserto de Eletrodomésticos",
      "Energia Solar",
      "Pintura Residencial",
      "Montagem de Móveis",
    ],
  },
  {
    group: "Entretenimento e Cultura",
    items: [
      "Boate / Balada / Casa Noturna",
      "Cinema",
      "Teatro / Shows",
      "Parque de Diversões / Aquático",
      "Escape Room / Laser Game",
      "Boliche / Sinuca",
      "Karaokê",
      "Museu / Galeria de Arte",
      "Biblioteca",
    ],
  },
  {
    group: "Religião e Comunidade",
    items: [
      "Igreja / Templo / Congregação",
      "Espaço Comunitário",
      "ONG / Associação",
    ],
  },
  {
    group: "Outros",
    items: ["Outro (não listado)"],
  },
];

export const DEFAULT_CATEGORIES: string[] = CATEGORY_GROUPS.flatMap(
  (g) => g.items,
);

export function parseCategories(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return raw ? [raw] : [];
  }
}

export function serializeCategories(items: string[]): string {
  return JSON.stringify(items);
}
