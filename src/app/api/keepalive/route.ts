import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Chamado semanalmente pelo Vercel Cron (vercel.json) para evitar pausa por inatividade do Supabase.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { error } = await getSupabaseServerClient().from("companies").select("id", { head: true, count: "exact" }).limit(1);
  if (error) {
    console.error("[keepalive] Supabase indisponível", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
