import { NextResponse } from "next/server";
import { readApiSessionFromRequest } from "@/lib/server-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ConsumerActionPayload =
  | { action: "getData"; userId: string }
  | { action: "generateCode"; userId: string; offerId: string };

const nowIso = () => new Date().toISOString();
const expiresAtIso = () => new Date(Date.now() + 10 * 60 * 1000).toISOString();
const makeCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const ensureUniqueCode = async () => {
  const supabase = getSupabaseServerClient();
  for (let i = 0; i < 10; i += 1) {
    const candidate = makeCode();
    const { data } = await supabase.from("redemptions").select("id").eq("code", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${Date.now().toString().slice(-6)}`;
};

export async function POST(request: Request) {
  try {
    const session = readApiSessionFromRequest(request);
    if (!session || session.role !== "consumer") {
      return NextResponse.json({ error: "Sessão inválida para consumidor." }, { status: 401 });
    }

    const body = (await request.json()) as ConsumerActionPayload;
    const supabase = getSupabaseServerClient();

    if (body.action === "getData") {
      const userId = body.userId?.trim();
      if (!userId || userId !== session.uid) {
        return NextResponse.json({ error: "userId inválido para esta sessão." }, { status: 400 });
      }

      await supabase
        .from("redemptions")
        .update({ status: "expired" })
        .eq("user_id", userId)
        .eq("status", "generated")
        .lt("expires_at", nowIso());

      const [usersRes, offersRes, companiesRes, redemptionsRes] = await Promise.all([
        supabase
          .from("users")
          .select("id, name, email, phone, neighborhood, role, company_id, created_at")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("offers")
          .select("id, company_id, title, description, discount_label, category, neighborhood, images, approved, rejected, created_at")
          .eq("approved", true)
          .eq("rejected", false)
          .order("created_at", { ascending: false }),
        supabase.from("companies").select("*").eq("approved", true),
        supabase.from("redemptions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      if (usersRes.error || !usersRes.data) {
        return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
      }
      if (offersRes.error || companiesRes.error || redemptionsRes.error) {
        return NextResponse.json({ error: "Falha ao carregar dados do consumidor." }, { status: 500 });
      }

      return NextResponse.json({
        user: usersRes.data,
        offers: offersRes.data ?? [],
        companies: companiesRes.data ?? [],
        redemptions: redemptionsRes.data ?? [],
      });
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

      const { data: inserted, error: insertError } = await supabase.from("redemptions").insert(redemption).select("*").single();

      if (insertError || !inserted) {
        return NextResponse.json({ error: "Falha ao gerar código de resgate." }, { status: 500 });
      }

      return NextResponse.json({ redemption: inserted });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Falha inesperada na API do consumidor." }, { status: 500 });
  }
}
