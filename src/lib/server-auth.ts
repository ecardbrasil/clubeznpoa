import { createHmac, timingSafeEqual } from "crypto";
import type { UserRole } from "@/lib/types";

type SessionPayload = {
  uid: string;
  role: UserRole;
  cid?: string;
  exp: number;
};

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const base64urlEncode = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const base64urlDecode = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const getSecret = () => {
  const secret = process.env.API_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("Missing API session secret. Set API_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY.");
  }
  return secret;
};

const signPart = (encodedPayload: string) => {
  const secret = getSecret();
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
};

export const createApiSessionToken = (input: {
  userId: string;
  role: UserRole;
  companyId?: string;
}) => {
  const payload: SessionPayload = {
    uid: input.userId,
    role: input.role,
    cid: input.companyId,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = signPart(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

const parseToken = (token: string): SessionPayload | null => {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPart(encodedPayload);
  const receivedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (receivedBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(receivedBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload)) as SessionPayload;
    if (!payload.uid || !payload.role || !payload.exp) return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

export const readApiSessionFromRequest = (request: Request): SessionPayload | null => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;
  return parseToken(token);
};

