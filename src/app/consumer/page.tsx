"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, routeByRole } from "@/lib/storage";

export default function ConsumerPage() {
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.replace("/auth");
      return;
    }

    if (currentUser.role !== "consumer") {
      router.replace(routeByRole(currentUser.role));
      return;
    }

    router.replace("/ofertas");
  }, [router]);

  return <main className="clubezn-shell">Carregando...</main>;
}

