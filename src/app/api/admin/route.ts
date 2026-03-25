import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { readApiSessionFromRequest } from "@/lib/server-auth";
import type { AppData, AppNotification, Company, Offer, Redemption, User } from "@/lib/types";

type AdminActionPayload = { action: "getDashboardData" };

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  neighborhood: string | null;
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

const mapUserRow = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  email: row.email ?? undefined,
  phone: row.phone ?? undefined,
  neighborhood: row.neighborhood ?? undefined,
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
    supabase.from("users").select("id, name, email, phone, neighborhood, role, company_id, created_at"),
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

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Falha inesperada na API do admin." }, { status: 500 });
  }
}
