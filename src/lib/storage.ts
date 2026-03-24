import { AppData, AppNotification, Company, Offer, Redemption, Session, User, UserRole } from "@/lib/types";
import { isSupabaseMode } from "@/lib/runtime-config";

const STORAGE_KEY = "clubezn_data_v1";
const SESSION_KEY = "clubezn_session_v1";

const nowIso = () => new Date().toISOString();

const defaultOfferImages = {
  o_1: [
    "https://picsum.photos/id/292/1200/675",
    "https://picsum.photos/id/312/1200/675",
    "https://picsum.photos/id/425/1200/675",
  ],
  o_2: [
    "https://picsum.photos/id/1059/1200/675",
    "https://picsum.photos/id/1060/1200/675",
    "https://picsum.photos/id/1025/1200/675",
  ],
  o_3: [
    "https://picsum.photos/id/431/1200/675",
    "https://picsum.photos/id/766/1200/675",
  ],
  o_4: [
    "https://picsum.photos/id/237/1200/675",
    "https://picsum.photos/id/169/1200/675",
  ],
  o_5: [
    "https://picsum.photos/id/1027/1200/675",
    "https://picsum.photos/id/1011/1200/675",
  ],
  o_6: [
    "https://picsum.photos/id/1005/1200/675",
    "https://picsum.photos/id/177/1200/675",
  ],
  o_7: [
    "https://picsum.photos/id/1080/1200/675",
    "https://picsum.photos/id/292/1200/675",
  ],
  o_8: [
    "https://picsum.photos/id/870/1200/675",
    "https://picsum.photos/id/823/1200/675",
  ],
} as const;

const isLegacyMockOfferImage = (value: string) => value.startsWith("data:image/svg+xml");

const createNotification = (
  input: Omit<AppNotification, "id" | "createdAt" | "read">,
): AppNotification => ({
  id: `n_${crypto.randomUUID()}`,
  createdAt: nowIso(),
  read: false,
  ...input,
});

const seedData = (): AppData => {
  const createdAt = nowIso();

  const admin: User = {
    id: "u_admin",
    name: "Administrador ClubeZN",
    email: "admin@clubezn.com",
    password: "123456",
    role: "admin",
    createdAt,
  };

  const partnerUser: User = {
    id: "u_partner_1",
    name: "Mercado Sarandi",
    email: "parceiro@sarandi.com",
    phone: "51999990001",
    password: "123456",
    role: "partner",
    companyId: "c_1",
    createdAt,
  };

  const consumerUser: User = {
    id: "u_consumer_1",
    name: "Morador ZN",
    email: "cliente@clubezn.com",
    phone: "51999990002",
    password: "123456",
    role: "consumer",
    createdAt,
  };

  const companies: Company[] = [
    {
      id: "c_1",
      name: "Mercado Sarandi",
      publicName: "Mercado Sarandi",
      category: "Supermercado",
      neighborhood: "Sarandi",
      city: "Porto Alegre",
      state: "RS",
      ownerUserId: partnerUser.id,
      approved: true,
      addressLine: "Av. Baltazar de Oliveira Garcia, 1200 - Sarandi, Porto Alegre/RS",
      instagram: "@mercadosarandi",
      whatsapp: "51999990001",
      createdAt,
    },
    {
      id: "c_2",
      name: "Farmácia Zona Norte",
      publicName: "Farmácia Zona Norte",
      category: "Farmácia",
      neighborhood: "Passo das Pedras",
      city: "Porto Alegre",
      state: "RS",
      ownerUserId: "u_placeholder",
      approved: true,
      createdAt,
    },
  ];

  const offers: Offer[] = [
    {
      id: "o_1",
      companyId: "c_1",
      title: "10% em compras acima de R$80",
      description: "Desconto válido em produtos selecionados do mercado.",
      discountLabel: "10% OFF",
      category: "Supermercado",
      neighborhood: "Sarandi",
      images: [...defaultOfferImages.o_1],
      approved: true,
      rejected: false,
      createdAt,
    },
    {
      id: "o_2",
      companyId: "c_2",
      title: "15% em medicamentos genéricos",
      description: "Válido para itens participantes, sujeito a disponibilidade.",
      discountLabel: "15% OFF",
      category: "Farmácia",
      neighborhood: "Passo das Pedras",
      images: [...defaultOfferImages.o_2],
      approved: true,
      rejected: false,
      createdAt,
    },
    {
      id: "o_3",
      companyId: "c_1",
      title: "Leve 3 pães e pague 2",
      description: "Promoção válida para pães franceses e integrais no mesmo cupom.",
      discountLabel: "PAGUE 2",
      category: "Alimentação",
      neighborhood: "Sarandi",
      images: [...defaultOfferImages.o_3],
      approved: true,
      rejected: false,
      createdAt,
    },
    {
      id: "o_4",
      companyId: "c_1",
      title: "20% OFF em banho e tosa",
      description: "Desconto para serviços agendados durante a semana.",
      discountLabel: "20% OFF",
      category: "Pet",
      neighborhood: "Sarandi",
      images: [...defaultOfferImages.o_4],
      approved: true,
      rejected: false,
      createdAt,
    },
    {
      id: "o_5",
      companyId: "c_1",
      title: "Escova + hidratação com desconto",
      description: "Pacote promocional para novos clientes no salão parceiro.",
      discountLabel: "30% OFF",
      category: "Beleza",
      neighborhood: "Sarandi",
      images: [...defaultOfferImages.o_5],
      approved: true,
      rejected: false,
      createdAt,
    },
    {
      id: "o_6",
      companyId: "c_2",
      title: "Consulta com valor promocional",
      description: "Atendimento com horário marcado para moradores da região.",
      discountLabel: "R$ 79,90",
      category: "Saúde",
      neighborhood: "Passo das Pedras",
      images: [...defaultOfferImages.o_6],
      approved: true,
      rejected: false,
      createdAt,
    },
    {
      id: "o_7",
      companyId: "c_1",
      title: "Combo churrasco com 12% OFF",
      description: "Inclui carnes selecionadas e itens para acompanhamento.",
      discountLabel: "12% OFF",
      category: "Supermercado",
      neighborhood: "Sarandi",
      images: [...defaultOfferImages.o_7],
      approved: true,
      rejected: false,
      createdAt,
    },
    {
      id: "o_8",
      companyId: "c_2",
      title: "Kit vitaminas com 18% OFF",
      description: "Desconto válido em kits sinalizados no balcão da farmácia.",
      discountLabel: "18% OFF",
      category: "Farmácia",
      neighborhood: "Passo das Pedras",
      images: [...defaultOfferImages.o_8],
      approved: true,
      rejected: false,
      createdAt,
    },
  ];

  return {
    users: [admin, partnerUser, consumerUser],
    companies,
    offers,
    redemptions: [],
    notifications: [],
  };
};

const ensureClient = () => typeof window !== "undefined";

export const initStorage = () => {
  if (isSupabaseMode) return;
  if (!ensureClient()) return;
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData()));
  }
};

export const getData = (): AppData => {
  if (!ensureClient()) return seedData();
  initStorage();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedData();
  const parsed = JSON.parse(raw) as AppData;
  let changed = false;
  // Backward compatibility: older local storage entries may not include offer images.
  parsed.offers = parsed.offers.map((offer) => {
    const hasImages = Array.isArray((offer as Offer & { images?: string[] }).images)
      ? (offer as Offer & { images?: string[] }).images ?? []
      : [];
    const defaults = defaultOfferImages[offer.id as keyof typeof defaultOfferImages];
    const shouldReplaceLegacyMockImages =
      Boolean(defaults) && hasImages.length > 0 && hasImages.every((image) => isLegacyMockOfferImage(image));

    if (shouldReplaceLegacyMockImages && defaults) {
      changed = true;
      return { ...offer, images: [...defaults], rejected: Boolean(offer.rejected) };
    }

    if (hasImages.length > 0) {
      return {
        ...offer,
        images: hasImages,
        rejected: Boolean(offer.rejected),
      };
    }

    if (defaults) {
      changed = true;
      return { ...offer, images: [...defaults], rejected: Boolean(offer.rejected) };
    }

    return { ...offer, images: [], rejected: Boolean(offer.rejected) };
  });

  // Backward compatibility: older local storage entries may not include newer seed offers.
  // Keep user-created data and only append seed offers that are missing by id.
  const seed = seedData();
  const offerIds = new Set(parsed.offers.map((offer) => offer.id));
  const companyIds = new Set(parsed.companies.map((company) => company.id));
  const missingSeedOffers = seed.offers.filter((offer) => !offerIds.has(offer.id) && companyIds.has(offer.companyId));

  if (missingSeedOffers.length > 0) {
    parsed.offers.push(...missingSeedOffers);
    changed = true;
  }

  if (!Array.isArray(parsed.notifications)) {
    parsed.notifications = [];
    changed = true;
  }

  if (changed) {
    saveData(parsed);
  }
  return parsed;
};

export const saveData = (data: AppData) => {
  if (isSupabaseMode) return;
  if (!ensureClient()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getCurrentUser = (): User | null => {
  if (!ensureClient()) return null;
  const sessionRaw = window.localStorage.getItem(SESSION_KEY);
  if (!sessionRaw) return null;

  const session = JSON.parse(sessionRaw) as Session;
  const data = getData();
  const fromData = data.users.find((u) => u.id === session.userId);
  if (fromData) return fromData;
  if (session.user && session.user.id === session.userId) return session.user;
  return null;
};

export const setSession = (userId: string, user?: User) => {
  if (!ensureClient()) return;
  const session: Session = { userId, user };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  if (!ensureClient()) return;
  window.localStorage.removeItem(SESSION_KEY);
};

export const signIn = (identifier: string, password: string): User | null => {
  const data = getData();
  const normalized = identifier.trim().toLowerCase();

  const user = data.users.find((u) => {
    const emailMatch = u.email?.toLowerCase() === normalized;
    const phoneMatch = u.phone === identifier.trim();
    return (emailMatch || phoneMatch) && u.password === password;
  });

  if (!user) return null;
  setSession(user.id, user);
  return user;
};

export interface SignUpInput {
  name: string;
  email?: string;
  phone?: string;
  neighborhood?: string;
  password: string;
  role: Extract<UserRole, "consumer" | "partner">;
  companyName?: string;
  companyCategory?: string;
  companyNeighborhood?: string;
}

export const signUp = (input: SignUpInput): { user?: User; error?: string } => {
  const data = getData();

  const hasIdentifier = Boolean(input.email?.trim()) || Boolean(input.phone?.trim());
  if (!hasIdentifier) {
    return { error: "Informe e-mail ou celular." };
  }

  const normalizedEmail = input.email?.trim().toLowerCase();
  const normalizedPhone = input.phone?.trim();

  const duplicated = data.users.find(
    (u) => (normalizedEmail && u.email?.toLowerCase() === normalizedEmail) || (normalizedPhone && u.phone === normalizedPhone),
  );

  if (duplicated) {
    return { error: "Já existe usuário com esse e-mail/celular." };
  }

  const userId = `u_${crypto.randomUUID()}`;
  let companyId: string | undefined;

  if (input.role === "partner") {
    if (!input.companyName || !input.companyCategory || !input.companyNeighborhood) {
      return { error: "Preencha os dados da empresa parceira." };
    }

    companyId = `c_${crypto.randomUUID()}`;
    data.companies.push({
      id: companyId,
      name: input.companyName,
      publicName: input.companyName,
      category: input.companyCategory,
      neighborhood: input.companyNeighborhood,
      city: "Porto Alegre",
      state: "RS",
      ownerUserId: userId,
      approved: true,
      createdAt: nowIso(),
    });
  }

  const user: User = {
    id: userId,
    name: input.name,
    email: normalizedEmail,
    phone: normalizedPhone,
    neighborhood: input.neighborhood?.trim(),
    password: input.password,
    role: input.role,
    companyId,
    createdAt: nowIso(),
  };

  data.users.push(user);
  saveData(data);
  setSession(user.id, user);

  return { user };
};

type SignInApiResponse = { user?: User };
type SignUpApiResponse = { user?: User; error?: string };

export const signInWithProvider = async (identifier: string, password: string): Promise<User | null> => {
  if (!isSupabaseMode) {
    return signIn(identifier, password);
  }

  const response = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "login",
      identifier,
      password,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as SignInApiResponse;
  if (!payload.user) return null;
  setSession(payload.user.id, payload.user);
  return payload.user;
};

export const signUpWithProvider = async (input: SignUpInput): Promise<{ user?: User; error?: string }> => {
  if (!isSupabaseMode) {
    return signUp(input);
  }

  const response = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "register",
      payload: input,
    }),
  });

  const payload = (await response.json()) as SignUpApiResponse;

  if (!response.ok || payload.error || !payload.user) {
    return { error: payload.error || "Não foi possível criar a conta." };
  }

  setSession(payload.user.id, payload.user);
  return { user: payload.user };
};

export const routeByRole = (role: UserRole): string => {
  if (role === "admin") return "/admin";
  if (role === "partner") return "/partner";
  return "/consumer";
};

export const getCompanyByUser = (user: User): Company | undefined => {
  if (!user.companyId) return undefined;
  const data = getData();
  return data.companies.find((c) => c.id === user.companyId);
};

export const createOffer = (input: {
  companyId: string;
  title: string;
  description: string;
  discountLabel: string;
  category: string;
  neighborhood: string;
  images: string[];
}) => {
  const data = getData();

  const offer: Offer = {
    id: `o_${crypto.randomUUID()}`,
    companyId: input.companyId,
    title: input.title,
    description: input.description,
    discountLabel: input.discountLabel,
    category: input.category,
    neighborhood: input.neighborhood,
    images: input.images.slice(0, 5),
    approved: true,
    rejected: false,
    createdAt: nowIso(),
  };

  data.offers.push(offer);
  saveData(data);

  return offer;
};

export const approveCompany = (companyId: string) => {
  const data = getData();
  const company = data.companies.find((item) => item.id === companyId);
  data.companies = data.companies.map((item) => (item.id === companyId ? { ...item, approved: true } : item));

  if (company) {
    data.notifications.push(
      createNotification({
        userId: company.ownerUserId,
        companyId: company.id,
        type: "company_approved",
        title: "Empresa aprovada",
        message: `Sua empresa ${company.publicName ?? company.name} foi aprovada e já pode publicar ofertas.`,
      }),
    );
  }

  saveData(data);
};

export const approveOffer = (offerId: string) => {
  const data = getData();
  const offer = data.offers.find((item) => item.id === offerId);
  const company = offer ? data.companies.find((item) => item.id === offer.companyId) : undefined;

  data.offers = data.offers.map((item) =>
    item.id === offerId ? { ...item, approved: true, rejected: false } : item,
  );

  if (offer && company) {
    data.notifications.push(
      createNotification({
        userId: company.ownerUserId,
        companyId: company.id,
        offerId: offer.id,
        type: "offer_approved",
        title: "Oferta aprovada",
        message: `A oferta "${offer.title}" foi aprovada pelo administrador.`,
      }),
    );
  }

  saveData(data);
};

export const rejectOffer = (offerId: string) => {
  const data = getData();
  const offer = data.offers.find((item) => item.id === offerId);
  const company = offer ? data.companies.find((item) => item.id === offer.companyId) : undefined;

  data.offers = data.offers.map((item) =>
    item.id === offerId ? { ...item, approved: false, rejected: true } : item,
  );

  if (offer && company) {
    data.notifications.push(
      createNotification({
        userId: company.ownerUserId,
        companyId: company.id,
        offerId: offer.id,
        type: "offer_rejected",
        title: "Oferta rejeitada",
        message: `A oferta "${offer.title}" foi rejeitada. Revise os dados e envie novamente.`,
      }),
    );
  }

  saveData(data);
};

export const markNotificationAsRead = (notificationId: string, userId: string) => {
  const data = getData();
  data.notifications = data.notifications.map((item) =>
    item.id === notificationId && item.userId === userId ? { ...item, read: true } : item,
  );
  saveData(data);
};

export const markAllNotificationsAsRead = (userId: string) => {
  const data = getData();
  data.notifications = data.notifications.map((item) => (item.userId === userId ? { ...item, read: true } : item));
  saveData(data);
};

export const updateCompanyProfile = (
  companyId: string,
  input: {
    publicName: string;
    addressLine: string;
    bio: string;
    instagram: string;
    facebook: string;
    website: string;
    whatsapp: string;
    logoImage?: string;
    coverImage?: string;
  },
): Company | undefined => {
  const data = getData();
  let updatedCompany: Company | undefined;

  data.companies = data.companies.map((company) => {
    if (company.id !== companyId) return company;

    updatedCompany = {
      ...company,
      publicName: input.publicName.trim() || company.name,
      addressLine: input.addressLine.trim(),
      bio: input.bio.trim(),
      instagram: input.instagram.trim(),
      facebook: input.facebook.trim(),
      website: input.website.trim(),
      whatsapp: input.whatsapp.trim(),
      logoImage: input.logoImage,
      coverImage: input.coverImage,
    };
    return updatedCompany;
  });

  saveData(data);
  return updatedCompany;
};

const makeCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export const generateRedemption = (userId: string, offerId: string): Redemption => {
  const data = getData();

  data.redemptions = data.redemptions.map((redemption) => {
    if (redemption.status !== "generated") return redemption;
    if (new Date(redemption.expiresAt).getTime() < Date.now()) {
      return { ...redemption, status: "expired" };
    }
    return redemption;
  });

  const redemption: Redemption = {
    id: `r_${crypto.randomUUID()}`,
    userId,
    offerId,
    code: makeCode(),
    status: "generated",
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };

  data.redemptions.push(redemption);
  saveData(data);

  return redemption;
};

export const validateCode = (
  code: string,
  partnerCompanyId: string,
): { ok: boolean; message: string; redemption?: Redemption } => {
  const data = getData();

  const redemption = data.redemptions.find((item) => item.code === code.trim());
  if (!redemption) {
    return { ok: false, message: "Código não encontrado." };
  }

  if (redemption.status !== "generated") {
    return { ok: false, message: "Código já utilizado ou expirado." };
  }

  if (new Date(redemption.expiresAt).getTime() < Date.now()) {
    redemption.status = "expired";
    saveData(data);
    return { ok: false, message: "Código expirado." };
  }

  const offer = data.offers.find((item) => item.id === redemption.offerId);
  if (!offer || offer.companyId !== partnerCompanyId) {
    return { ok: false, message: "Código não pertence à sua empresa." };
  }

  redemption.status = "used";
  redemption.usedAt = nowIso();
  saveData(data);

  return { ok: true, message: "Benefício validado com sucesso.", redemption };
};

export const resetDemoData = () => {
  if (isSupabaseMode) return;
  if (!ensureClient()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData()));
  window.localStorage.removeItem(SESSION_KEY);
};

export const syncRedemptionExpirations = () => {
  const data = getData();
  let changed = false;

  data.redemptions = data.redemptions.map((redemption) => {
    if (redemption.status === "generated" && new Date(redemption.expiresAt).getTime() < Date.now()) {
      changed = true;
      return { ...redemption, status: "expired" };
    }
    return redemption;
  });

  if (changed) saveData(data);
};
