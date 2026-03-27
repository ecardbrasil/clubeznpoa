import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { readApiSessionFromRequest } from "@/lib/server-auth";
import type { AppData, AppNotification, Company, Offer, Redemption, User } from "@/lib/types";

type AdminActionPayload =
  | { action: "getDashboardData" }
  | { action: "approveCompany"; companyId: string }
  | { action: "approveOffer"; offerId: string }
  | { action: "rejectOffer"; offerId: string }
  | { action: "deleteOffer"; offerId: string }
  | { action: "blockUser"; userId: string }
  | { action: "unblockUser"; userId: string }
  | { action: "deleteUser"; userId: string }
  | { action: "updateUserRole"; userId: string; role: "consumer" | "partner" | "admin" };

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

const nowIso = () => new Date().toISOString();

const createNotification = (
  input: Omit<AppNotification, "id" | "createdAt" | "read">,
): Omit<NotificationRow, "read" | "created_at"> & { read: boolean; created_at: string } => ({
  id: `n_${crypto.randomUUID()}`,
  user_id: input.userId,
  company_id: input.companyId ?? null,
  offer_id: input.offerId ?? null,
  type: input.type,
  title: input.title,
  message: input.message,
  read: false,
  created_at: nowIso(),
});

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

const ensureAdminUser = async (userId: string): Promise<boolean> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("users").select("id").eq("id", userId).eq("role", "admin").eq("blocked", false).maybeSingle();
  return !error && Boolean(data);
};

const getDashboardData = async (): Promise<{ data?: AppData; error?: string }> => {
  const supabase = getSupabaseServerClient();

  await supabase.from("redemptions").update({ status: "expired" }).eq("status", "generated").lt("expires_at", nowIso());

  const [usersRes, companiesRes, offersRes, redemptionsRes, notificationsRes] = await Promise.all([
    supabase.from("users").select("id, name, email, phone, neighborhood, role, company_id, blocked, created_at"),
    supabase
      .from("companies")
      .select(
        "id, name, public_name, category, neighborhood, city, state, owner_user_id, approved, logo_image, cover_image, address_line, bio, instagram, facebook, website, whatsapp, created_at",
      ),
    supabase
      .from("offers")
      .select("id, company_id, title, description, discount_label, category, neighborhood, images, approved, rejected, created_at"),
    supabase.from("redemptions").select("id, user_id, offer_id, code, status, created_at, expires_at, used_at"),
    supabase.from("notifications").select("id, user_id, company_id, offer_id, type, title, message, read, created_at"),
  ]);

  if (usersRes.error || companiesRes.error || offersRes.error || redemptionsRes.error || notificationsRes.error) {
    return { error: "Falha ao carregar dados administrativos." };
  }

  return {
    data: {
      users: ((usersRes.data ?? []) as UserRow[]).map(mapUserRow),
      companies: ((companiesRes.data ?? []) as CompanyRow[]).map(mapCompanyRow),
      offers: ((offersRes.data ?? []) as OfferRow[]).map(mapOfferRow),
      redemptions: ((redemptionsRes.data ?? []) as RedemptionRow[]).map(mapRedemptionRow),
      notifications: ((notificationsRes.data ?? []) as NotificationRow[]).map(mapNotificationRow),
    },
  };
};

const loadOfferContext = async (offerId: string): Promise<{ offer?: OfferRow; company?: CompanyRow; error?: string }> => {
  const supabase = getSupabaseServerClient();
  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .select("id, company_id, title, description, discount_label, category, neighborhood, images, approved, rejected, created_at")
    .eq("id", offerId)
    .maybeSingle<OfferRow>();

  if (offerError || !offer) {
    return { error: "Oferta não encontrada." };
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select(
      "id, name, public_name, category, neighborhood, city, state, owner_user_id, approved, logo_image, cover_image, address_line, bio, instagram, facebook, website, whatsapp, created_at",
    )
    .eq("id", offer.company_id)
    .maybeSingle<CompanyRow>();

  if (companyError || !company) {
    return { error: "Empresa da oferta não encontrada." };
  }

  return { offer, company };
};

const approveCompany = async (companyId: string): Promise<{ error?: string }> => {
  const supabase = getSupabaseServerClient();
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select(
      "id, name, public_name, category, neighborhood, city, state, owner_user_id, approved, logo_image, cover_image, address_line, bio, instagram, facebook, website, whatsapp, created_at",
    )
    .eq("id", companyId)
    .maybeSingle<CompanyRow>();

  if (companyError || !company) return { error: "Empresa não encontrada." };

  const { error: updateError } = await supabase.from("companies").update({ approved: true }).eq("id", companyId);
  if (updateError) return { error: "Falha ao aprovar empresa." };

  const notification = createNotification({
    userId: company.owner_user_id,
    companyId: company.id,
    type: "company_approved",
    title: "Empresa aprovada",
    message: `Sua empresa ${company.public_name ?? company.name} foi aprovada e já pode publicar ofertas.`,
  });

  await supabase.from("notifications").insert(notification);
  return {};
};

const approveOffer = async (offerId: string): Promise<{ error?: string }> => {
  const supabase = getSupabaseServerClient();
  const context = await loadOfferContext(offerId);
  if (!context.offer || !context.company) return { error: context.error || "Oferta não encontrada." };

  const { error: updateError } = await supabase.from("offers").update({ approved: true, rejected: false }).eq("id", offerId);
  if (updateError) return { error: "Falha ao aprovar oferta." };

  const notification = createNotification({
    userId: context.company.owner_user_id,
    companyId: context.company.id,
    offerId: context.offer.id,
    type: "offer_approved",
    title: "Oferta aprovada",
    message: `A oferta "${context.offer.title}" foi aprovada pelo administrador.`,
  });

  await supabase.from("notifications").insert(notification);
  return {};
};

const rejectOffer = async (offerId: string): Promise<{ error?: string }> => {
  const supabase = getSupabaseServerClient();
  const context = await loadOfferContext(offerId);
  if (!context.offer || !context.company) return { error: context.error || "Oferta não encontrada." };

  const { error: updateError } = await supabase.from("offers").update({ approved: false, rejected: true }).eq("id", offerId);
  if (updateError) return { error: "Falha ao rejeitar oferta." };

  const notification = createNotification({
    userId: context.company.owner_user_id,
    companyId: context.company.id,
    offerId: context.offer.id,
    type: "offer_rejected",
    title: "Oferta rejeitada",
    message: `A oferta "${context.offer.title}" foi rejeitada. Revise os dados e envie novamente.`,
  });

  await supabase.from("notifications").insert(notification);
  return {};
};

const deleteOffer = async (offerId: string): Promise<{ error?: string }> => {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("offers").delete().eq("id", offerId);
  if (error) return { error: "Falha ao excluir oferta." };
  return {};
};

const loadUserById = async (userId: string): Promise<{ user?: UserRow; error?: string }> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, phone, neighborhood, role, company_id, blocked, created_at")
    .eq("id", userId)
    .maybeSingle<UserRow>();

  if (error || !data) return { error: "Usuário não encontrado." };
  return { user: data };
};

const blockUser = async (currentAdminId: string, userId: string): Promise<{ error?: string }> => {
  if (currentAdminId === userId) return { error: "Não é permitido bloquear o próprio usuário admin." };
  const supabase = getSupabaseServerClient();
  const loaded = await loadUserById(userId);
  if (!loaded.user) return { error: loaded.error || "Usuário não encontrado." };

  const { error } = await supabase.from("users").update({ blocked: true }).eq("id", userId);
  if (error) return { error: "Falha ao bloquear usuário." };
  return {};
};

const unblockUser = async (userId: string): Promise<{ error?: string }> => {
  const supabase = getSupabaseServerClient();
  const loaded = await loadUserById(userId);
  if (!loaded.user) return { error: loaded.error || "Usuário não encontrado." };

  const { error } = await supabase.from("users").update({ blocked: false }).eq("id", userId);
  if (error) return { error: "Falha ao desbloquear usuário." };
  return {};
};

const updateUserRole = async (
  currentAdminId: string,
  userId: string,
  role: "consumer" | "partner" | "admin",
): Promise<{ error?: string }> => {
  if (currentAdminId === userId) return { error: "Não é permitido alterar o próprio papel." };
  const supabase = getSupabaseServerClient();
  const loaded = await loadUserById(userId);
  if (!loaded.user) return { error: loaded.error || "Usuário não encontrado." };
  if (loaded.user.company_id || loaded.user.role === "partner" || role === "partner") {
    return { error: "Alteração de papel para usuários vinculados a empresa deve ser feita em fluxo dedicado." };
  }

  const { error } = await supabase.from("users").update({ role }).eq("id", userId);
  if (error) return { error: "Falha ao atualizar papel do usuário." };
  return {};
};

const deleteUser = async (currentAdminId: string, userId: string): Promise<{ error?: string }> => {
  if (currentAdminId === userId) return { error: "Não é permitido excluir o próprio usuário admin." };
  const supabase = getSupabaseServerClient();
  const loaded = await loadUserById(userId);
  if (!loaded.user) return { error: loaded.error || "Usuário não encontrado." };

  const { error } = await supabase.from("users").delete().eq("id", userId);
  if (error) return { error: "Falha ao excluir usuário." };
  return {};
};

export async function POST(request: Request) {
  try {
    const session = readApiSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Sessão inválida para acesso administrativo." }, { status: 401 });
    }

    const body = (await request.json()) as AdminActionPayload;
    const isAdmin = await ensureAdminUser(session.uid);
    if (!isAdmin) {
      return NextResponse.json({ error: "Usuário sem permissão de administrador." }, { status: 403 });
    }

    if (body.action === "getDashboardData") {
      const output = await getDashboardData();
      if (output.error || !output.data) {
        return NextResponse.json({ error: output.error || "Falha ao carregar painel admin." }, { status: 500 });
      }
      return NextResponse.json({ data: output.data });
    }

    if (body.action === "approveCompany") {
      const output = await approveCompany(body.companyId);
      if (output.error) {
        return NextResponse.json({ error: output.error }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "approveOffer") {
      const output = await approveOffer(body.offerId);
      if (output.error) {
        return NextResponse.json({ error: output.error }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "rejectOffer") {
      const output = await rejectOffer(body.offerId);
      if (output.error) {
        return NextResponse.json({ error: output.error }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "deleteOffer") {
      const output = await deleteOffer(body.offerId);
      if (output.error) {
        return NextResponse.json({ error: output.error }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "blockUser") {
      const output = await blockUser(session.uid, body.userId);
      if (output.error) {
        return NextResponse.json({ error: output.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "unblockUser") {
      const output = await unblockUser(body.userId);
      if (output.error) {
        return NextResponse.json({ error: output.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "updateUserRole") {
      const output = await updateUserRole(session.uid, body.userId, body.role);
      if (output.error) {
        return NextResponse.json({ error: output.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "deleteUser") {
      const output = await deleteUser(session.uid, body.userId);
      if (output.error) {
        return NextResponse.json({ error: output.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Falha inesperada na API do admin." }, { status: 500 });
  }
}
