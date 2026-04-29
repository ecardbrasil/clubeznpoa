import { NextResponse } from "next/server";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createApiSessionToken } from "@/lib/server-auth";
import type { SignUpInput } from "@/lib/storage";
import type { User } from "@/lib/types";

type SupabaseUserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  neighborhood: string | null;
  password?: string;
  role: "consumer" | "partner" | "admin";
  company_id: string | null;
  blocked: boolean;
  created_at: string;
};

const mapUserRow = (row: SupabaseUserRow): User => ({
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

const createUserId = () => `u_${crypto.randomUUID()}`;
const createCompanyId = () => `c_${crypto.randomUUID()}`;
const HASH_PREFIX = "scrypt";

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${HASH_PREFIX}$${salt}$${hash}`;
};

const verifyPassword = (password: string, stored: string) => {
  if (!stored.startsWith(`${HASH_PREFIX}$`)) {
    return { valid: stored === password, shouldRehash: true };
  }

  const [, salt, hash] = stored.split("$");
  if (!salt || !hash) return { valid: false, shouldRehash: false };

  const providedHash = scryptSync(password, salt, 64).toString("hex");
  const expectedBuffer = Buffer.from(hash, "hex");
  const providedBuffer = Buffer.from(providedHash, "hex");
  if (expectedBuffer.length !== providedBuffer.length) return { valid: false, shouldRehash: false };
  return {
    valid: timingSafeEqual(expectedBuffer, providedBuffer),
    shouldRehash: false,
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as
      | { action: "login"; identifier: string; password: string }
      | { action: "register"; payload: SignUpInput }
      | { action: "requestPasswordReset"; identifier: string }
      | { action: "confirmPasswordReset"; identifier: string; otp: string; newPassword: string };

    const supabase = getSupabaseServerClient();

    if (body.action === "login") {
      const identifier = body.identifier.trim();
      const passwordInput = body.password;
      const normalizedEmail = identifier.toLowerCase();

      const baseQuery = supabase
        .from("users")
        .select("id, name, email, phone, neighborhood, password, role, company_id, blocked, created_at")
        .limit(1);

      const loginQuery = identifier.includes("@")
        ? baseQuery.eq("email", normalizedEmail)
        : baseQuery.eq("phone", identifier);

      const { data, error } = await loginQuery.maybeSingle<SupabaseUserRow>();

      if (error || !data) {
        return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
      }
      if (data.blocked) {
        return NextResponse.json({ error: "Conta bloqueada. Entre em contato com o suporte." }, { status: 403 });
      }

      const passwordCheck = verifyPassword(passwordInput, data.password ?? "");
      if (!passwordCheck.valid) {
        return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
      }
      if (passwordCheck.shouldRehash) {
        await supabase.from("users").update({ password: hashPassword(passwordInput) }).eq("id", data.id);
      }

      const user = mapUserRow(data);
      const token = createApiSessionToken({
        userId: user.id,
        role: user.role,
        companyId: user.companyId,
      });
      return NextResponse.json({ user, token });
    }

    if (body.action === "requestPasswordReset") {
      const identifier = body.identifier.trim();
      if (!identifier) {
        return NextResponse.json({ error: "Informe e-mail ou celular." }, { status: 400 });
      }

      const baseQuery = supabase.from("users").select("id").limit(1);
      const lookupQuery = identifier.includes("@")
        ? baseQuery.eq("email", identifier.toLowerCase())
        : baseQuery.eq("phone", identifier);

      const { data } = await lookupQuery.maybeSingle<{ id: string }>();
      // Always return success to avoid user enumeration
      if (!data) {
        return NextResponse.json({ ok: true });
      }

      // Delete any existing tokens for this user
      await supabase.from("password_reset_tokens").delete().eq("user_id", data.id);

      const rawOtp = String(Math.floor(100000 + Math.random() * 900000));
      const tokenHash = createHash("sha256").update(rawOtp).digest("hex");
      const tokenId = `prt_${crypto.randomUUID()}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      await supabase.from("password_reset_tokens").insert({
        id: tokenId,
        user_id: data.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      });

      // TODO: deliver rawOtp via email/SMS to the user instead of returning it here
      return NextResponse.json({ ok: true, otp: rawOtp });
    }

    if (body.action === "confirmPasswordReset") {
      const identifier = body.identifier.trim();
      const { otp, newPassword } = body;

      if (!identifier || !otp || !newPassword) {
        return NextResponse.json({ error: "Dados incompletos para redefinição de senha." }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Senha inválida para redefinição." }, { status: 400 });
      }

      const baseQuery = supabase.from("users").select("id").limit(1);
      const lookupQuery = identifier.includes("@")
        ? baseQuery.eq("email", identifier.toLowerCase())
        : baseQuery.eq("phone", identifier);

      const { data: userData } = await lookupQuery.maybeSingle<{ id: string }>();
      if (!userData) {
        return NextResponse.json({ error: "Código inválido ou expirado." }, { status: 400 });
      }

      const { data: tokenRow } = await supabase
        .from("password_reset_tokens")
        .select("id, token_hash, expires_at")
        .eq("user_id", userData.id)
        .maybeSingle<{ id: string; token_hash: string; expires_at: string }>();

      if (!tokenRow) {
        return NextResponse.json({ error: "Código inválido ou expirado." }, { status: 400 });
      }

      if (new Date(tokenRow.expires_at) < new Date()) {
        await supabase.from("password_reset_tokens").delete().eq("id", tokenRow.id);
        return NextResponse.json({ error: "Código expirado. Solicite um novo." }, { status: 400 });
      }

      const providedHash = createHash("sha256").update(otp.trim()).digest("hex");
      const expectedBuf = Buffer.from(tokenRow.token_hash, "hex");
      const providedBuf = Buffer.from(providedHash, "hex");
      const otpValid =
        expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf);

      if (!otpValid) {
        return NextResponse.json({ error: "Código inválido ou expirado." }, { status: 400 });
      }

      await supabase.from("password_reset_tokens").delete().eq("id", tokenRow.id);

      const { error: updateError } = await supabase
        .from("users")
        .update({ password: hashPassword(newPassword) })
        .eq("id", userData.id);

      if (updateError) {
        return NextResponse.json({ error: "Não foi possível redefinir a senha." }, { status: 400 });
      }

      return NextResponse.json({ ok: true });
    }

    const input = body.payload;
    const hasIdentifier = Boolean(input.email?.trim()) || Boolean(input.phone?.trim());
    if (!hasIdentifier) {
      return NextResponse.json({ error: "Informe e-mail ou celular." }, { status: 400 });
    }

    const normalizedEmail = input.email?.trim().toLowerCase();
    const normalizedPhone = input.phone?.trim();

    if (normalizedEmail) {
      const { data: duplicatedEmail } = await supabase
        .from("users")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();
      if (duplicatedEmail) {
        return NextResponse.json({ error: "Já existe usuário com esse e-mail/celular." }, { status: 409 });
      }
    }

    if (normalizedPhone) {
      const { data: duplicatedPhone } = await supabase
        .from("users")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();
      if (duplicatedPhone) {
        return NextResponse.json({ error: "Já existe usuário com esse e-mail/celular." }, { status: 409 });
      }
    }

    const userId = createUserId();
    const nowIso = new Date().toISOString();

    const { error: userInsertError } = await supabase.from("users").insert({
      id: userId,
      name: input.name,
      email: normalizedEmail ?? null,
      phone: normalizedPhone ?? null,
      neighborhood: input.neighborhood?.trim() ?? null,
      role: input.role,
      company_id: null,
      blocked: false,
      created_at: nowIso,
      password: hashPassword(input.password),
    });

    if (userInsertError) {
      return NextResponse.json({ error: "Não foi possível criar o usuário." }, { status: 400 });
    }

    let companyId: string | null = null;
    if (input.role === "partner") {
      if (!input.companyName || !input.companyCategory || !input.companyNeighborhood) {
        return NextResponse.json({ error: "Preencha os dados da empresa parceira." }, { status: 400 });
      }

      companyId = createCompanyId();
      const { error: companyInsertError } = await supabase.from("companies").insert({
        id: companyId,
        name: input.companyName,
        public_name: input.companyName,
        category: input.companyCategory,
        neighborhood: input.companyNeighborhood,
        city: "Porto Alegre",
        state: "RS",
        owner_user_id: userId,
        approved: false,
        created_at: nowIso,
      });

      if (companyInsertError) {
        await supabase.from("users").delete().eq("id", userId);
        return NextResponse.json({ error: "Não foi possível criar a empresa parceira." }, { status: 400 });
      }

      await supabase.from("users").update({ company_id: companyId }).eq("id", userId);
    }

    const { data: createdRow, error: readBackError } = await supabase
      .from("users")
      .select("id, name, email, phone, neighborhood, role, company_id, blocked, created_at")
      .eq("id", userId)
      .single<SupabaseUserRow>();

    if (readBackError || !createdRow) {
      return NextResponse.json({ error: "Conta criada, mas falhou ao recuperar sessão." }, { status: 500 });
    }

    const user = mapUserRow(createdRow);
    const token = createApiSessionToken({
      userId: user.id,
      role: user.role,
      companyId: user.companyId,
    });
    return NextResponse.json({ user, token });
  } catch {
    return NextResponse.json({ error: "Falha inesperada no serviço de autenticação." }, { status: 500 });
  }
}
