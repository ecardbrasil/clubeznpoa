"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { clearSession, getCurrentUser, routeByRole } from "@/lib/storage";
import type { User } from "@/lib/types";

type HeaderLink = {
  label: string;
  href: string;
};

type SiteHeaderProps = {
  subtitle?: string;
  smallLogo?: boolean;
  sticky?: boolean;
  links?: HeaderLink[];
  className?: string;
  actionsSlot?: ReactNode;
};

const defaultLinks: HeaderLink[] = [
  { label: "Início", href: "/" },
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Para empresas", href: "/#empresas" },
  { label: "Entrar", href: "/auth" },
];

export function SiteHeader({
  subtitle,
  smallLogo = true,
  sticky = false,
  links = defaultLinks,
  className = "",
  actionsSlot,
}: SiteHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(() => getCurrentUser());

  const resolvedLinks = useMemo(() => {
    if (!user) return links;
    return links
      .filter((item) => item.label !== "Entrar")
      .concat([{ label: "Meu painel", href: routeByRole(user.role) }]);
  }, [links, user]);

  const rootClassName = [
    sticky ? "sticky top-0 z-30" : "",
    "rounded-full border border-[#d6e88c] bg-white/95 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur md:px-6",
    className,
  ]
    .join(" ")
    .trim();

  return (
    <header className={rootClassName}>
      <div className="flex items-center justify-between gap-3">
        <BrandLogo small={smallLogo} />

        <nav aria-label="Navegação principal" className="hidden items-center gap-5 md:flex">
          {resolvedLinks.map((item) =>
            item.href.startsWith("#") ? (
              <a key={`${item.label}-${item.href}`} href={item.href} className="text-sm font-semibold text-[#1b2a20] no-underline hover:text-[#0f1a13]">
                {item.label}
              </a>
            ) : (
              <Link key={`${item.label}-${item.href}`} href={item.href} className="text-sm font-semibold text-[#1b2a20] no-underline hover:text-[#0f1a13]">
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href={routeByRole(user.role)} className="rounded-full border border-[#d9d9d9] bg-[#f8faf7] px-3 py-2 text-xs font-bold text-[#1b2a20] no-underline">
                Meu painel
              </Link>
              <button
                type="button"
                className="rounded-full bg-[#13210f] px-3 py-2 text-xs font-black text-white"
                onClick={() => {
                  clearSession();
                  setUser(null);
                  router.push("/auth");
                }}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/auth" className="rounded-full border border-[#d9d9d9] bg-[#f8faf7] px-3 py-2 text-xs font-bold text-[#1b2a20] no-underline">
                Entrar
              </Link>
              <Link href="/auth" className="rounded-full bg-[#13210f] px-3 py-2 text-xs font-black text-white no-underline">
                Cadastrar empresa
              </Link>
            </>
          )}
          {actionsSlot}
        </div>
      </div>

      {subtitle ? <p className="m-0 mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{subtitle}</p> : null}
    </header>
  );
}
