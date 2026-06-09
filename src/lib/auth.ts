import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { scryptSync, timingSafeEqual, randomUUID } from "crypto";
import type { User } from "@/lib/types";

const HASH_PREFIX = "scrypt";

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
    shouldRehash: false,
  };
};

type SupabaseUserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  neighborhood: string | null;
  password?: string | null;
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

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        const supabase = getSupabaseServerClient();
        const identifier = (credentials.identifier as string).trim();
        const passwordInput = credentials.password as string;

        const baseQuery = supabase
          .from("users")
          .select("id, name, email, phone, neighborhood, password, role, company_id, blocked, created_at")
          .limit(1);

        const loginQuery = identifier.includes("@")
          ? baseQuery.eq("email", identifier.toLowerCase())
          : baseQuery.eq("phone", identifier);

        const { data, error } = await loginQuery.maybeSingle<SupabaseUserRow>();

        if (error || !data) return null;
        if (data.blocked) return null;

        const passwordCheck = verifyPassword(passwordInput, data.password ?? "");
        if (!passwordCheck.valid) return null;

        const user = mapUserRow(data);
        return { ...user, id: user.id } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.companyId = (user as any).companyId;
      }

      if (account?.provider === "google" && token.email) {
        const supabase = getSupabaseServerClient();
        const email = token.email.toLowerCase();

        const { data: existingUser } = await supabase
          .from("users")
          .select("id, name, email, phone, neighborhood, role, company_id, blocked, created_at")
          .eq("email", email)
          .maybeSingle<SupabaseUserRow>();

        if (existingUser) {
          if (existingUser.blocked) {
            return null as any;
          }
          token.id = existingUser.id;
          token.role = existingUser.role;
          token.companyId = existingUser.company_id ?? undefined;
        } else {
          const userId = `u_${randomUUID()}`;
          const nowIso = new Date().toISOString();

          const { error } = await supabase.from("users").insert({
            id: userId,
            name: token.name || "",
            email: email,
            phone: null,
            neighborhood: null,
            role: "consumer",
            company_id: null,
            blocked: false,
            created_at: nowIso,
            password: null,
          });

          if (!error) {
            token.id = userId;
            token.role = "consumer";
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).companyId = token.companyId;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {}
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
