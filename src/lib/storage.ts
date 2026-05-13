// Client-side auth helpers and storage stubs
// Data persistence is handled via Supabase; session token stored in sessionStorage

import type { AppData, User, UserRole } from "@/lib/types";

// ---------- Types ----------

export type SignUpInput = {
  name: string;
  email?: string;
  phone?: string;
  neighborhood?: string;
  password: string;
  role: "consumer" | "partner";
  companyName?: string;
  companyCategory?: string;
  companyNeighborhood?: string;
};

// ---------- Legacy stubs (data now in Supabase) ----------

export function initStorage() {}

export function getData(): AppData {
  return { offers: [], companies: [], users: [], redemptions: [], notifications: [] };
}

export function saveData() {}

// ---------- Session helpers ----------

const USER_KEY = "zn_user";
const TOKEN_KEY = "zn_token";

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User, token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// ---------- Routing ----------

export function routeByRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "partner":
      return "/partner";
    case "consumer":
    default:
      return "/ofertas";
  }
}

// ---------- Auth providers (call API routes) ----------

export async function signInWithProvider(
  identifier: string,
  password: string,
): Promise<{ user?: User; error?: string }> {
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", identifier, password }),
    });
    const data = (await res.json()) as { user?: User; token?: string; error?: string };
    if (!res.ok || !data.user || !data.token) {
      return { error: data.error ?? "Não foi possível entrar." };
    }
    setCurrentUser(data.user, data.token);
    return { user: data.user };
  } catch {
    return { error: "Falha de conexão. Tente novamente." };
  }
}

export async function signUpWithProvider(
  input: SignUpInput,
): Promise<{ user?: User; error?: string }> {
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", payload: input }),
    });
    const data = (await res.json()) as { user?: User; token?: string; error?: string };
    if (!res.ok || !data.user || !data.token) {
      return { error: data.error ?? "Não foi possível criar a conta." };
    }
    setCurrentUser(data.user, data.token);
    return { user: data.user };
  } catch {
    return { error: "Falha de conexão. Tente novamente." };
  }
}

export async function requestPasswordResetWithProvider(
  identifier: string,
): Promise<{ ok?: boolean; otp?: string; error?: string }> {
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "requestPasswordReset", identifier }),
    });
    const data = (await res.json()) as { ok?: boolean; otp?: string; error?: string };
    if (!res.ok) return { error: data.error ?? "Não foi possível enviar o código." };
    return { ok: true, otp: data.otp };
  } catch {
    return { error: "Falha de conexão. Tente novamente." };
  }
}

export async function confirmPasswordResetWithProvider(
  identifier: string,
  otp: string,
  newPassword: string,
): Promise<{ ok?: boolean; error?: string }> {
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirmPasswordReset", identifier, otp, newPassword }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) return { error: data.error ?? "Não foi possível redefinir a senha." };
    return { ok: true };
  } catch {
    return { error: "Falha de conexão. Tente novamente." };
  }
}

// ---------- Redemption (client-side stub — real logic via API) ----------

export function generateRedemption(_userId: string, _offerId: string): void {
  // Redemption creation is handled server-side via /api/consumer
}

export function syncRedemptionExpirations(): void {}

// ---------- Admin stubs (real logic via /api/admin) ----------

export function approveCompany(_companyId: string): { error?: string } {
  return {};
}

export function approveOffer(_offerId: string): { error?: string } {
  return {};
}

export function blockUser(_userId: string): { error?: string } {
  return {};
}

export function deleteUser(_userId: string): { error?: string } {
  return {};
}

export function deleteOffer(_offerId: string): { error?: string } {
  return {};
}

export function rejectOffer(_offerId: string): { error?: string } {
  return {};
}

export function unblockUser(_userId: string): { error?: string } {
  return {};
}

export function updateUserRole(_userId: string, _role: UserRole): { error?: string } {
  return {};
}

// ---------- Partner stubs (real logic via /api/partner) ----------

export async function createOffer(_payload: Record<string, unknown>): Promise<{ error?: string }> {
  return {};
}

export function markNotificationAsRead(_notificationId: string, _userId?: string): void {}

export function markAllNotificationsAsRead(_userId?: string): void {}

export function updateCompanyProfile(_companyId: string, _payload: Record<string, unknown>): void {}

export function validateCode(_code: string, _companyId?: string): { ok: boolean; message: string } {
  return { ok: false, message: "Modo local não disponível." };
}

// ---------- Consumer stubs (real logic via /api/consumer) ----------

export function updateConsumerProfile(
  _userId: string,
  _payload: Record<string, unknown>,
): { error?: string; user?: User } {
  return {};
}
