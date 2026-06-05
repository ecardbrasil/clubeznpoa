"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { SignUpInput } from "@/lib/storage";

const HASH_PREFIX = "scrypt";

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${HASH_PREFIX}$${salt}$${hash}`;
};

const verifyPassword = (password: string, stored: string) => {
  if (!stored) return { valid: false, shouldRehash: false };
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
    shouldRehash: true,
  };
};

const createUserId = () => `u_${crypto.randomUUID()}`;
const createCompanyId = () => `c_${crypto.randomUUID()}`;

export async function serverSignIn(identifier: string, password: string) {
  try {
    const supabase = getSupabaseServerClient();
    identifier = identifier.trim();

    const baseQuery = supabase
      .from("users")
      .select("id, name, email, phone, neighborhood, password, role, company_id, blocked, created_at")
      .limit(1);

    const loginQuery = identifier.includes("@")
      ? baseQuery.eq("email", identifier.toLowerCase())
      : baseQuery.eq("phone", identifier);

    const { data, error } = await loginQuery.maybeSingle<any>();

    if (error || !data) {
      return { error: "Credenciais inválidas." };
    }
    if (data.blocked) {
      return { error: "Conta bloqueada. Entre em contato com o suporte." };
    }

    const passwordCheck = verifyPassword(password, data.password ?? "");
    if (!passwordCheck.valid) {
      return { error: "Credenciais inválidas." };
    }
    if (passwordCheck.shouldRehash) {
      await supabase.from("users").update({ password: hashPassword(password) }).eq("id", data.id);
    }

    return { ok: true };
  } catch {
    return { error: "Erro ao fazer login" };
  }
}

export async function serverSignUp(input: SignUpInput) {
  const supabase = getSupabaseServerClient();

  try {
    const hasIdentifier = Boolean(input.email?.trim()) || Boolean(input.phone?.trim());
    if (!hasIdentifier) {
      return { error: "Informe e-mail ou celular." };
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
        return { error: "Já existe usuário com esse e-mail." };
      }
    }

    if (normalizedPhone) {
      const { data: duplicatedPhone } = await supabase
        .from("users")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();
      if (duplicatedPhone) {
        return { error: "Já existe usuário com esse celular." };
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
      return { error: "Não foi possível criar o usuário." };
    }

    let companyId: string | null = null;
    if (input.role === "partner") {
      if (!input.companyName || !input.companyCategory || !input.companyNeighborhood) {
        return { error: "Preencha os dados da empresa parceira." };
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
        return { error: "Não foi possível criar a empresa parceira." };
      }

      await supabase.from("users").update({ company_id: companyId }).eq("id", userId);
    }

    return { ok: true };
  } catch {
    return { error: "Erro ao criar conta" };
  }
}

export async function requestPasswordReset(identifier: string) {
  const supabase = getSupabaseServerClient();

  try {
    identifier = identifier.trim();
    if (!identifier) {
      return { error: "Informe e-mail ou celular." };
    }

    const isEmail = identifier.includes("@");
    const baseQuery = supabase.from("users").select("id, name, email").limit(1);
    const lookupQuery = isEmail
      ? baseQuery.eq("email", identifier.toLowerCase())
      : baseQuery.eq("phone", identifier);

    const { data } = await lookupQuery.maybeSingle<{ id: string; name: string; email: string | null }>();

    if (!data || (!isEmail && !data.email)) {
      return { ok: true };
    }

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const internalSecret = process.env.SEND_RESET_EMAIL_SECRET!;
    const emailTo = isEmail ? identifier.toLowerCase() : data.email!;

    try {
      await fetch(`${supabaseUrl}/functions/v1/send-reset-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": internalSecret,
        },
        body: JSON.stringify({ to: emailTo, otp: rawOtp, name: data.name }),
      });
    } catch {
      // Silent fail on email send
    }

    return { ok: true };
  } catch {
    return { error: "Erro ao solicitar reset de senha" };
  }
}

export async function confirmPasswordReset(identifier: string, otp: string, newPassword: string) {
  const supabase = getSupabaseServerClient();

  try {
    identifier = identifier.trim();
    if (!identifier || !otp || !newPassword) {
      return { error: "Dados incompletos." };
    }

    if (newPassword.length < 6) {
      return { error: "Senha inválida." };
    }

    const baseQuery = supabase.from("users").select("id").limit(1);
    const lookupQuery = identifier.includes("@")
      ? baseQuery.eq("email", identifier.toLowerCase())
      : baseQuery.eq("phone", identifier);

    const { data: userData } = await lookupQuery.maybeSingle<{ id: string }>();
    if (!userData) {
      return { error: "Código inválido ou expirado." };
    }

    const { data: tokenRow } = await supabase
      .from("password_reset_tokens")
      .select("id, token_hash, expires_at")
      .eq("user_id", userData.id)
      .maybeSingle<{ id: string; token_hash: string; expires_at: string }>();

    if (!tokenRow) {
      return { error: "Código inválido ou expirado." };
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      await supabase.from("password_reset_tokens").delete().eq("id", tokenRow.id);
      return { error: "Código expirado." };
    }

    const providedHash = createHash("sha256").update(otp.trim()).digest("hex");
    const expectedBuf = Buffer.from(tokenRow.token_hash, "hex");
    const providedBuf = Buffer.from(providedHash, "hex");
    const otpValid = expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf);

    if (!otpValid) {
      return { error: "Código inválido." };
    }

    await supabase.from("password_reset_tokens").delete().eq("id", tokenRow.id);

    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashPassword(newPassword) })
      .eq("id", userData.id);

    if (updateError) {
      return { error: "Não foi possível redefinir a senha." };
    }

    return { ok: true };
  } catch {
    return { error: "Erro ao redefinir senha" };
  }
}
