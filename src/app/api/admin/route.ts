import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AppData, AppNotification, Company, Offer, Redemption, User } from "@/lib/types";

type AdminActionPayload =
  | { action: "getDashboardData"; userId: string }
  | { action: "approveCompany"; userId: string; companyId: string }
  | { action: "approveOffer"; userId: string; offerId: string }
  | { action: "rejectOffer"; userId: string; offerId: string };

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  neighborhood: string | null;
  password: string;
  role: "consumer" | "partner" | "admin";
  company_id: string | null;
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
): NotificationRow => ({
  id: `n_${crypto.randomUUID()}`,
  created_at: nowIso(),
  read: false,
  user_id: input.userId,
  company_id: input.companyId ?? null,
  offer_id: input.offerId ?? null,
  type: input.type,
  title: input.title,
  message: input.message,
});

const mapUserRow = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  email: row.email ?? undefined,
  phone: row.phone ?? undefined,
  neighborhood: row.neighborhood ?? undefined,
  password: row.password,
  role: row.role,
  companyId: row.company_id ?? undefined,
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
  const { data, error } = await supabase.from("users").select("id").eq("id", userId).eq("role", "admin").maybeSingle();
  return !error && Boolean(data);
};

const getDashboardData = async (): Promise<{ data?: AppData; error?: string }> => {
  const supabase = getSupabaseServerClient();

  await supabase.from("redemptions").update({ status: "expired" }).eq("status", "generated").lt("expires_at", nowIso());

  const [usersRes, companiesRes, offersRes, redemptionsRes, notificationsRes] = await Promise.all([
    supabase.from("users").select("id, name, email, phone, neighborhood, password, role, company_id, created_at"),
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AdminActionPayload;
    const userId = body.userId?.trim();
    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório." }, { status: 400 });
    }

    const isAdmin = await ensureAdminUser(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Usuário sem permissão de administrador." }, { status: 403 });
    }

    const supabase = getSupabaseServerClient();

    if (body.action === "getDashboardData") {
      const output = await getDashboardData();
      if (output.error || !output.data) {
        return NextResponse.json({ error: output.error || "Falha ao carregar painel admin." }, { status: 500 });
      }
      return NextResponse.json({ data: output.data });
    }

    if (body.action === "approveCompany") {
      const companyId = body.companyId?.trim();
      if (!companyId) {
        return NextResponse.json({ error: "companyId é obrigatório." }, { status: 400 });
      }

      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, name, public_name, owner_user_id")
        .eq("id", companyId)
        .maybeSingle<{ id: string; name: string; public_name: string | null; owner_user_id: string }>();
      if (companyError || !company) {
        return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
      }

      const { error } = await supabase.from("companies").update({ approved: true }).eq("id", companyId);
      if (error) {
        return NextResponse.json({ error: "Falha ao aprovar empresa." }, { status: 500 });
      }

      const notification = createNotification({
        userId: company.owner_user_id,
        companyId: company.id,
        type: "company_approved",
        title: "Empresa aprovada",
        message: `Sua empresa ${company.public_name ?? company.name} foi aprovada e já pode publicar ofertas.`,
      });
      await supabase.from("notifications").insert(notification);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "approveOffer" || body.action === "rejectOffer") {
      const offerId = body.offerId?.trim();
      if (!offerId) {
        return NextResponse.json({ error: "offerId é obrigatório." }, { status: 400 });
      }

      const { data: offer, error: offerError } = await supabase
        .from("offers")
        .select("id, title, company_id")
        .eq("id", offerId)
        .maybeSingle<{ id: string; title: string; company_id: string }>();
      if (offerError || !offer) {
        return NextResponse.json({ error: "Oferta não encontrada." }, { status: 404 });
      }

      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, owner_user_id")
        .eq("id", offer.company_id)
        .maybeSingle<{ id: string; owner_user_id: string }>();
      if (companyError || !company) {
        return NextResponse.json({ error: "Empresa da oferta não encontrada." }, { status: 404 });
      }

      if (body.action === "approveOffer") {
        const { error } = await supabase.from("offers").update({ approved: true, rejected: false }).eq("id", offerId);
        if (error) {
          return NextResponse.json({ error: "Falha ao aprovar oferta." }, { status: 500 });
        }
        const notification = createNotification({
          userId: company.owner_user_id,
          companyId: company.id,
          offerId: offer.id,
          type: "offer_approved",
          title: "Oferta aprovada",
          message: `A oferta "${offer.title}" foi aprovada pelo administrador.`,
        });
        await supabase.from("notifications").insert(notification);
        return NextResponse.json({ ok: true });
      }

      const { error } = await supabase.from("offers").update({ approved: false, rejected: true }).eq("id", offerId);
      if (error) {
        return NextResponse.json({ error: "Falha ao rejeitar oferta." }, { status: 500 });
      }
      const notification = createNotification({
        userId: company.owner_user_id,
        companyId: company.id,
        offerId: offer.id,
        type: "offer_rejected",
        title: "Oferta rejeitada",
        message: `A oferta "${offer.title}" foi rejeitada. Revise os dados e envie novamente.`,
      });
      await supabase.from("notifications").insert(notification);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Falha inesperada na API do admin." }, { status: 500 });
  }
}
