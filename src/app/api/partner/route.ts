import { NextResponse } from "next/server";
import { readApiSessionFromRequest } from "@/lib/server-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AppData, AppNotification, Company, Offer, Redemption, User } from "@/lib/types";

type PartnerActionPayload =
  | { action: "getCompany"; companyId: string }
  | { action: "getDashboardData"; companyId: string }
  | {
      action: "updateProfile";
      companyId: string;
      payload: {
        publicName: string;
        addressLine: string;
        bio: string;
        instagram: string;
        facebook: string;
        website: string;
        whatsapp: string;
        logoImage?: string;
        coverImage?: string;
      };
    }
  | {
      action: "createOffer";
      companyId: string;
      payload: {
        title: string;
        description: string;
        discountLabel: string;
        category: string;
        neighborhood: string;
        images: string[];
      };
    }
  | { action: "validateCode"; companyId: string; code: string }
  | { action: "markNotificationAsRead"; companyId: string; notificationId: string }
  | { action: "markAllNotificationsAsRead"; companyId: string };

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  neighborhood: string | null;
  role: "consumer" | "partner" | "admin";
  company_id: string | null;
  blocked: boolean;
  created_at: string;
};

type OfferRow = {
  id: string;
  company_id: string;
  title: string;
  description: string;
  discount_label: string;
  category: string;
  neighborhood: string;
  images: string[] | null;
  approved: boolean;
  rejected: boolean;
  created_at: string;
};

type RedemptionRow = {
  id: string;
  user_id: string;
  offer_id: string;
  code: string;
  status: "generated" | "used" | "expired";
  created_at: string;
  expires_at: string;
  used_at: string | null;
};

type NotificationRow = {
  id: string;
  user_id: string;
  company_id: string | null;
  offer_id: string | null;
  type: "company_approved" | "offer_approved" | "offer_rejected";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

type CompanyIdentityRow = {
  id: string;
  owner_user_id: string;
  name: string;
  approved: boolean;
};

type StatusResponse = {
  ok: boolean;
  message: string;
  redemption?: Redemption;
};

const nowIso = () => new Date().toISOString();

const mapUserRow = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  email: row.email ?? undefined,
  phone: row.phone ?? undefined,
  neighborhood: row.neighborhood ?? undefined,
  role: row.role,
  companyId: row.company_id ?? undefined,
  blocked: row.blocked,
  createdAt: row.created_at,
});

const mapOfferRow = (row: OfferRow): Offer => ({
  id: row.id,
  companyId: row.company_id,
  title: row.title,
  description: row.description,
  discountLabel: row.discount_label,
  category: row.category,
  neighborhood: row.neighborhood,
  images: Array.isArray(row.images) ? row.images : [],
  approved: row.approved,
  rejected: row.rejected,
  createdAt: row.created_at,
});

const mapRedemptionRow = (row: RedemptionRow): Redemption => ({
  id: row.id,
  userId: row.user_id,
  offerId: row.offer_id,
  code: row.code,
  status: row.status,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  usedAt: row.used_at ?? undefined,
});

const mapNotificationRow = (row: NotificationRow): AppNotification => ({
  id: row.id,
  userId: row.user_id,
  companyId: row.company_id ?? undefined,
  offerId: row.offer_id ?? undefined,
  type: row.type,
  title: row.title,
  message: row.message,
  read: row.read,
  createdAt: row.created_at,
});

const loadOwnedCompany = async (
  companyId: string,
  ownerUserId: string,
): Promise<{ company?: CompanyIdentityRow; response?: NextResponse }> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, owner_user_id, name, approved")
    .eq("id", companyId)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle<CompanyIdentityRow>();

  if (error || !data) {
    return {
      response: NextResponse.json({ error: "Empresa não encontrada para este parceiro." }, { status: 404 }),
    };
  }

  return { company: data };
};

const getDashboardData = async (companyId: string, ownerUserId: string): Promise<{ data?: AppData; error?: string }> => {
  const owned = await loadOwnedCompany(companyId, ownerUserId);
  if (!owned.company) {
    return { error: "Empresa não encontrada para este parceiro." };
  }

  const supabase = getSupabaseServerClient();
  const now = nowIso();

  const { data: offersData, error: offersError } = await supabase
    .from("offers")
    .select("id, company_id, title, description, discount_label, category, neighborhood, images, approved, rejected, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (offersError) return { error: "Falha ao carregar ofertas da empresa." };

  const offerRows = (offersData ?? []) as OfferRow[];
  const offerIds = offerRows.map((offer) => offer.id);

  if (offerIds.length > 0) {
    await supabase
      .from("redemptions")
      .update({ status: "expired" })
      .in("offer_id", offerIds)
      .eq("status", "generated")
      .lt("expires_at", now);
  }

  const [companyRes, redemptionsRes, notificationsRes] = await Promise.all([
    supabase
      .from("companies")
      .select(
        "id, name, public_name, category, neighborhood, city, state, owner_user_id, approved, logo_image, cover_image, address_line, bio, instagram, facebook, website, whatsapp, created_at",
      )
      .eq("id", companyId)
      .eq("owner_user_id", ownerUserId)
      .single<CompanyRow>(),
    offerIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("redemptions")
          .select("id, user_id, offer_id, code, status, created_at, expires_at, used_at")
          .in("offer_id", offerIds)
          .order("created_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("id, user_id, company_id, offer_id, type, title, message, read, created_at")
      .eq("user_id", ownerUserId)
      .order("created_at", { ascending: false }),
  ]);

  if (companyRes.error || !companyRes.data) return { error: "Falha ao carregar empresa do parceiro." };
  if (redemptionsRes.error) return { error: "Falha ao carregar resgates da empresa." };
  if (notificationsRes.error) return { error: "Falha ao carregar notificações do parceiro." };

  const redemptionsRows = (redemptionsRes.data ?? []) as RedemptionRow[];
  const notificationRows = (notificationsRes.data ?? []) as NotificationRow[];
  const redemptionUserIds = Array.from(new Set(redemptionsRows.map((row) => row.user_id)));

  const [ownerUserRes, consumersRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, email, phone, neighborhood, role, company_id, blocked, created_at")
      .eq("id", ownerUserId)
      .maybeSingle<UserRow>(),
    redemptionUserIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("users")
          .select("id, name, email, phone, neighborhood, role, company_id, blocked, created_at")
          .in("id", redemptionUserIds),
  ]);

  if (ownerUserRes.error || !ownerUserRes.data) return { error: "Falha ao carregar usuário parceiro." };
  if (consumersRes.error) return { error: "Falha ao carregar usuários relacionados aos resgates." };

  const ownerUser = mapUserRow(ownerUserRes.data);
  const consumerUsers = ((consumersRes.data ?? []) as UserRow[])
    .filter((row) => row.id !== ownerUser.id)
    .map(mapUserRow);

  return {
    data: {
      users: [ownerUser, ...consumerUsers],
      companies: [mapCompanyRow(companyRes.data)],
      offers: offerRows.map(mapOfferRow),
      redemptions: redemptionsRows.map(mapRedemptionRow),
      notifications: notificationRows.map(mapNotificationRow),
    },
  };
};

const validatePartnerCode = async (companyId: string, code: string): Promise<StatusResponse> => {
  const supabase = getSupabaseServerClient();
  const trimmedCode = code.trim();

  const { data: redemption, error: redemptionError } = await supabase
    .from("redemptions")
    .select("id, user_id, offer_id, code, status, created_at, expires_at, used_at")
    .eq("code", trimmedCode)
    .maybeSingle<RedemptionRow>();

  if (redemptionError || !redemption) {
    return { ok: false, message: "Código não encontrado." };
  }

  if (redemption.status !== "generated") {
    return { ok: false, message: "Código já utilizado ou expirado." };
  }

  if (new Date(redemption.expires_at).getTime() < Date.now()) {
    await supabase.from("redemptions").update({ status: "expired" }).eq("id", redemption.id);
    return { ok: false, message: "Código expirado." };
  }

  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .select("id, company_id")
    .eq("id", redemption.offer_id)
    .maybeSingle<{ id: string; company_id: string }>();

  if (offerError || !offer || offer.company_id !== companyId) {
    return { ok: false, message: "Código não pertence à sua empresa." };
  }

  const usedAt = nowIso();
  const { data: updated, error: updateError } = await supabase
    .from("redemptions")
    .update({ status: "used", used_at: usedAt })
    .eq("id", redemption.id)
    .select("id, user_id, offer_id, code, status, created_at, expires_at, used_at")
    .single<RedemptionRow>();

  if (updateError || !updated) {
    return { ok: false, message: "Falha ao validar código." };
  }

  return { ok: true, message: "Benefício validado com sucesso.", redemption: mapRedemptionRow(updated) };
};

type CompanyRow = {
  id: string;
  name: string;
  public_name: string | null;
  category: string;
  neighborhood: string;
  city: string;
  state: string;
  owner_user_id: string;
  approved: boolean;
  logo_image: string | null;
  cover_image: string | null;
  address_line: string | null;
  bio: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  whatsapp: string | null;
  created_at: string;
};

const mapCompanyRow = (row: CompanyRow): Company => ({
  id: row.id,
  name: row.name,
  publicName: row.public_name ?? undefined,
  category: row.category,
  neighborhood: row.neighborhood,
  city: row.city,
  state: row.state,
  ownerUserId: row.owner_user_id,
  approved: row.approved,
  logoImage: row.logo_image ?? undefined,
  coverImage: row.cover_image ?? undefined,
  addressLine: row.address_line ?? undefined,
  bio: row.bio ?? undefined,
  instagram: row.instagram ?? undefined,
  facebook: row.facebook ?? undefined,
  website: row.website ?? undefined,
  whatsapp: row.whatsapp ?? undefined,
  createdAt: row.created_at,
});

const trimOrNull = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export async function POST(request: Request) {
  try {
    const session = readApiSessionFromRequest(request);
    if (!session || session.role !== "partner") {
      return NextResponse.json({ error: "Sessão inválida para parceiro." }, { status: 401 });
    }

    const body = (await request.json()) as PartnerActionPayload;
    const supabase = getSupabaseServerClient();
    const { data: activePartner, error: activePartnerError } = await supabase
      .from("users")
      .select("id")
      .eq("id", session.uid)
      .eq("role", "partner")
      .eq("blocked", false)
      .maybeSingle();

    if (activePartnerError || !activePartner) {
      return NextResponse.json({ error: "Usuário parceiro sem permissão ativa." }, { status: 403 });
    }

    const companyId = body.companyId?.trim();
    const ownerUserId = session.uid;
    if (!companyId) {
      return NextResponse.json({ error: "companyId é obrigatório." }, { status: 400 });
    }
    if (session.cid && companyId !== session.cid) {
      return NextResponse.json({ error: "companyId incompatível com a sessão atual." }, { status: 403 });
    }

    if (body.action === "getCompany") {
      const { data, error } = await supabase
        .from("companies")
        .select(
          "id, name, public_name, category, neighborhood, city, state, owner_user_id, approved, logo_image, cover_image, address_line, bio, instagram, facebook, website, whatsapp, created_at",
        )
        .eq("id", companyId)
        .eq("owner_user_id", ownerUserId)
        .maybeSingle<CompanyRow>();

      if (error || !data) {
        return NextResponse.json({ error: "Empresa não encontrada para este parceiro." }, { status: 404 });
      }

      return NextResponse.json({ company: mapCompanyRow(data) });
    }

    if (body.action === "getDashboardData") {
      const output = await getDashboardData(companyId, ownerUserId);
      if (output.error || !output.data) {
        return NextResponse.json({ error: output.error || "Falha ao carregar painel do parceiro." }, { status: 500 });
      }
      return NextResponse.json({ data: output.data });
    }

    if (body.action === "updateProfile") {
      const payload = body.payload;
      const { data: currentCompany, error: currentError } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", companyId)
        .eq("owner_user_id", ownerUserId)
        .maybeSingle<{ id: string; name: string }>();

      if (currentError || !currentCompany) {
        return NextResponse.json({ error: "Empresa não encontrada para atualizar perfil." }, { status: 404 });
      }

      const normalizedPublicName = payload.publicName?.trim() || currentCompany.name;

      const { data, error } = await supabase
        .from("companies")
        .update({
          public_name: normalizedPublicName,
          address_line: trimOrNull(payload.addressLine),
          bio: trimOrNull(payload.bio),
          instagram: trimOrNull(payload.instagram),
          facebook: trimOrNull(payload.facebook),
          website: trimOrNull(payload.website),
          whatsapp: trimOrNull(payload.whatsapp),
          logo_image: trimOrNull(payload.logoImage),
          cover_image: trimOrNull(payload.coverImage),
        })
        .eq("id", companyId)
        .eq("owner_user_id", ownerUserId)
        .select(
          "id, name, public_name, category, neighborhood, city, state, owner_user_id, approved, logo_image, cover_image, address_line, bio, instagram, facebook, website, whatsapp, created_at",
        )
        .single<CompanyRow>();

      if (error || !data) {
        return NextResponse.json({ error: "Falha ao atualizar perfil da empresa." }, { status: 500 });
      }

      return NextResponse.json({ company: mapCompanyRow(data) });
    }

    if (body.action === "createOffer") {
      const owned = await loadOwnedCompany(companyId, ownerUserId);
      if (!owned.company) {
        return owned.response;
      }
      if (!owned.company.approved) {
        return NextResponse.json({ error: "Sua empresa ainda está pendente de aprovação. Aguarde para publicar ofertas." }, { status: 403 });
      }

      const payload = body.payload;
      const now = nowIso();
      const insertPayload = {
        id: `o_${crypto.randomUUID()}`,
        company_id: companyId,
        title: payload.title.trim(),
        description: payload.description.trim(),
        discount_label: payload.discountLabel.trim(),
        category: payload.category.trim(),
        neighborhood: payload.neighborhood.trim(),
        images: payload.images.slice(0, 5),
        approved: false,
        rejected: false,
        created_at: now,
      };

      const { data, error } = await supabase
        .from("offers")
        .insert(insertPayload)
        .select("id, company_id, title, description, discount_label, category, neighborhood, images, approved, rejected, created_at")
        .single<OfferRow>();

      if (error || !data) {
        return NextResponse.json({ error: "Falha ao criar oferta para o parceiro." }, { status: 500 });
      }

      return NextResponse.json({ offer: mapOfferRow(data) });
    }

    if (body.action === "validateCode") {
      const owned = await loadOwnedCompany(companyId, ownerUserId);
      if (!owned.company) {
        return owned.response;
      }
      const result = await validatePartnerCode(companyId, body.code);
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    if (body.action === "markNotificationAsRead") {
      const owned = await loadOwnedCompany(companyId, ownerUserId);
      if (!owned.company) {
        return owned.response;
      }

      const notificationId = body.notificationId?.trim();
      if (!notificationId) {
        return NextResponse.json({ error: "notificationId é obrigatório." }, { status: 400 });
      }

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", ownerUserId);
      if (error) {
        return NextResponse.json({ error: "Falha ao atualizar notificação." }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (body.action === "markAllNotificationsAsRead") {
      const owned = await loadOwnedCompany(companyId, ownerUserId);
      if (!owned.company) {
        return owned.response;
      }

      const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", ownerUserId);
      if (error) {
        return NextResponse.json({ error: "Falha ao atualizar notificações." }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Falha inesperada na API do parceiro." }, { status: 500 });
  }
}
