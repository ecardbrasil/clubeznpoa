import { NextRequest, NextResponse } from "next/server";
import { readApiSessionFromRequest } from "@/lib/server-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = readApiSessionFromRequest(request);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID da oferta não informado." }, { status: 400 });
  }

  let featured: boolean;
  try {
    const body = (await request.json()) as { featured?: unknown };
    if (typeof body.featured !== "boolean") {
      return NextResponse.json({ error: "Campo 'featured' deve ser boolean." }, { status: 400 });
    }
    featured = body.featured;
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("offers")
    .update({ is_featured: featured })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Falha ao atualizar oferta." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
