import { NextResponse } from "next/server";
import { readApiSessionFromRequest } from "@/lib/server-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AppData, AppNotification, Company, Offer, Redemption, User } from "@/lib/types";

type ConsumerActionPayload =
  | { action: "getData"; userId: string }
  | { action: "generateCode"; userId: string; offerId: string }
  | {
      action: "updateProfile";
      userId: string;
      payload: {
        name: string;
        email?: string;
        phone?: string;
        neighborhood?: string;
      };
    };

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
const expiresAtIso = () => new Date(Date.now() + 10 * 60 * 1000).toISOString();
const makeCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const trimOrNull = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

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

const ensureUniqueCode = async () => {
  const supabase = getSupabaseServerClient();
  for (let i = 0; i < 10; i += 1) {
    const candidate = makeCode();
    const { data } = await supabase.from("redemptions").select("id").eq("code", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${Date.now().toString().slice(-6)}`;
};

const getDashboardData = async (userId: string): Promise<{ data?: AppData; error?: string }> => {
  const supabase = getSupabaseServerClient();
  await supabase
    .from("redemptions")
    .update({ status: "expired" })
    .eq("user_id", userId)
    .eq("status", "generated")
    .lt("expires_at", nowIso());

  const [userRes, offersRes, companiesRes, redemptionsRes, notificationsRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, email, phone, neighborhood, role, company_id, blocked, created_at")
      .eq("id", userId)
      .maybeSingle<UserRow>(),
    supabase
      .from("offers")
      .select("id, company_id, title, description, discount_label, category, neighborhood, images, approved, rejected, created_at")
      .eq("approved", true)
      .eq("rejected", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("companies")
      .select(
        "id, name, public_name, category, neighborhood, city, state, owner_user_id, approved, logo_image, cover_image, address_line, bio, instagram, facebook, website, whatsapp, created_at",
      )
      .eq("approved", true),
    supabase.from("redemptions").select("id, user_id, offer_id, code, status, created_at, expires_at, used_at").eq("user_id", userId),
    supabase.from("notifications").select("id, user_id, company_id, offer_id, type, title, message, read, created_at").eq("user_id", userId),
  ]);

  if (userRes.error || !userRes.data) return { error: "Usuário não encontrado." };
  if (offersRes.error || companiesRes.error || redemptionsRes.error || notificationsRes.error) {
    return { error: "Falha ao carregar dados do consumidor." };
  }

  return {
    data: {
      users: [mapUserRow(userRes.data)],
      offers: ((offersRes.data ?? []) as OfferRow[]).map(mapOfferRow),
      companies: ((companiesRes.data ?? []) as CompanyRow[]).map(mapCompanyRow),
      redemptions: ((redemptionsRes.data ?? []) as RedemptionRow[]).map(mapRedemptionRow),
      notifications: ((notificationsRes.data ?? []) as NotificationRow[]).map(mapNotificationRow),
    },
  };
};

export async function POST(request: Request) {
  try {
    const session = readApiSessionFromRequest(request);
    if (!session || session.role !== "consumer") {
      return NextResponse.json({ error: "Sessão inválida para consumidor." }, { status: 401 });
    }

    const body = (await request.json()) as ConsumerActionPayload;
    const supabase = getSupabaseServerClient();
    const { data: activeUser, error: activeUserError } = await supabase
      .from("users")
      .select("id")
      .eq("id", session.uid)
      .eq("role", "consumer")
      .eq("blocked", false)
      .maybeSingle();

    if (activeUserError || !activeUser) {
      return NextResponse.json({ error: "Usuário consumidor sem permissão ativa." }, { status: 403 });
    }

    if (body.action === "getData") {
      const userId = body.userId?.trim();
      if (!userId || userId !== session.uid) {
        return NextResponse.json({ error: "userId inválido para esta sessão." }, { status: 400 });
      }

      const output = await getDashboardData(userId);
      if (output.error || !output.data) {
        return NextResponse.json({ error: output.error || "Falha ao carregar dados do consumidor." }, { status: 500 });
      }
      return NextResponse.json({ data: output.data });
    }

    if (body.action === "generateCode") {
      const userId = body.userId?.trim();
      const offerId = body.offerId?.trim();
      if (!userId || userId !== session.uid || !offerId) {
        return NextResponse.json({ error: "Parâmetros inválidos para esta sessão." }, { status: 400 });
      }

      await supabase
        .from("redemptions")
        .update({ status: "expired" })
        .eq("user_id", userId)
        .eq("status", "generated")
        .lt("expires_at", nowIso());

      const { data: offer, error: offerError } = await supabase
        .from("offers")
        .select("id, company_id, approved, rejected")
        .eq("id", offerId)
        .maybeSingle();

      if (offerError || !offer || offer.rejected || !offer.approved) {
        return NextResponse.json({ error: "Oferta indisponível para resgate." }, { status: 400 });
      }

      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("id", offer.company_id)
        .eq("approved", true)
        .maybeSingle();

      if (companyError || !company) {
        return NextResponse.json({ error: "Parceiro indisponível para resgate." }, { status: 400 });
      }

      const code = await ensureUniqueCode();
      const redemption = {
        id: `r_${crypto.randomUUID()}`,
        user_id: userId,
        offer_id: offerId,
        code,
        status: "generated" as const,
        created_at: nowIso(),
        expires_at: expiresAtIso(),
      };

      const { data: inserted, error: insertError } = await supabase
        .from("redemptions")
        .insert(redemption)
        .select("id, user_id, offer_id, code, status, created_at, expires_at, used_at")
        .single<RedemptionRow>();

      if (insertError || !inserted) {
        return NextResponse.json({ error: "Falha ao gerar código de resgate." }, { status: 500 });
      }

      return NextResponse.json({ redemption: mapRedemptionRow(inserted) });
    }

    if (body.action === "updateProfile") {
      const userId = body.userId?.trim();
      if (!userId || userId !== session.uid) {
        return NextResponse.json({ error: "userId inválido para esta sessão." }, { status: 400 });
      }

      const normalizedName = body.payload.name?.trim();
      const normalizedEmail = body.payload.email?.trim().toLowerCase() || "";
      const normalizedPhone = body.payload.phone?.trim() || "";
      if (!normalizedName) {
        return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
      }
      if (!normalizedEmail && !normalizedPhone) {
        return NextResponse.json({ error: "Informe e-mail ou celular." }, { status: 400 });
      }

      if (normalizedEmail) {
        const { data: duplicatedEmail, error: duplicatedEmailError } = await supabase
          .from("users")
          .select("id")
          .eq("email", normalizedEmail)
          .neq("id", userId)
          .maybeSingle();
        if (duplicatedEmailError) {
          return NextResponse.json({ error: "Falha ao validar e-mail informado." }, { status: 500 });
        }
        if (duplicatedEmail) {
          return NextResponse.json({ error: "Já existe usuário com esse e-mail/celular." }, { status: 409 });
        }
      }

      if (normalizedPhone) {
        const { data: duplicatedPhone, error: duplicatedPhoneError } = await supabase
          .from("users")
          .select("id")
          .eq("phone", normalizedPhone)
          .neq("id", userId)
          .maybeSingle();
        if (duplicatedPhoneError) {
          return NextResponse.json({ error: "Falha ao validar celular informado." }, { status: 500 });
        }
        if (duplicatedPhone) {
          return NextResponse.json({ error: "Já existe usuário com esse e-mail/celular." }, { status: 409 });
        }
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          name: normalizedName,
          email: trimOrNull(normalizedEmail),
          phone: trimOrNull(normalizedPhone),
          neighborhood: trimOrNull(body.payload.neighborhood),
        })
        .eq("id", userId)
        .eq("role", "consumer")
        .select("id, name, email, phone, neighborhood, role, company_id, blocked, created_at")
        .single<UserRow>();

      if (updateError || !updatedUser) {
        return NextResponse.json({ error: "Falha ao atualizar perfil do consumidor." }, { status: 500 });
      }

      return NextResponse.json({ user: mapUserRow(updatedUser) });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Falha inesperada na API do consumidor." }, { status: 500 });
  }
}
