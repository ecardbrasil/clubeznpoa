"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { getCurrentUser, syncApiSession } from "@/lib/storage";

// Mantém sessionStorage (token de API) alinhado com a sessão NextAuth (login e-mail ou Google).
export function SessionBridge() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || getCurrentUser()) return;
    void syncApiSession().then((user) => {
      if (user) window.location.reload();
    });
  }, [status]);

  return null;
}
