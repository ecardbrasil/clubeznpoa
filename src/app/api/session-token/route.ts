import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createApiSessionToken } from "@/lib/server-auth";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

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

// Troca a sessão NextAuth (cookie HttpOnly) pelo token Bearer usado pelas APIs dos painéis.
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sem sessão." }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, phone, neighborhood, role, company_id, blocked, created_at")
    .eq("id", userId)
    .maybeSingle<UserRow>();

  if (error || !data || data.blocked) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const user: User = {
    id: data.id,
    name: data.name,
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    neighborhood: data.neighborhood ?? undefined,
    role: data.role,
    companyId: data.company_id ?? undefined,
    blocked: data.blocked,
    createdAt: data.created_at,
  };
  const token = createApiSessionToken({ userId: user.id, role: user.role, companyId: user.companyId });
  return NextResponse.json({ user, token }, { headers: { "Cache-Control": "no-store" } });
}
