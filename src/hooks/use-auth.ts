"use client";

import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user as (User & { id: string; role: string }) | undefined;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const signOut = async () => {
    await nextAuthSignOut({ callbackUrl: "/" });
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    signOut,
    session,
  };
}
