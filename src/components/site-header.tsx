"use client";

import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { getCurrentUser, clearSession } from "@/lib/storage";
import type { User } from "@/lib/types";

type HeaderLink = {
  label: string;
  href: string;
};

type SiteHeaderProps = {
  subtitle?: string;
  smallLogo?: boolean;
  logoScale?: number;
  sticky?: boolean;
  links?: HeaderLink[];
  className?: string;
  actionsSlot?: ReactNode;
};

const publicLinks: HeaderLink[] = [
  { label: "Início", href: "/" },
  { label: "Como funciona", href: "/sobre" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Para empresas", href: "/#empresas" },
];


function NavLink({ href, children, onClick }: { href: string; children: ReactNode; onClick?: () => void }) {
  const isAnchor = href.startsWith("#") || href.startsWith("/#");
  const cls = "text-sm font-semibold text-[#1b2a20] no-underline hover:text-[#0f1a13]";
  if (isAnchor) {
    return (
      <a href={href} className={cls} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} onClick={onClick}>
      {children}
    </Link>
  );
}

export function SiteHeader({
  subtitle,
  smallLogo = true,
  logoScale = 1.2,
  sticky = false,
  links = publicLinks,
  className = "",
  actionsSlot,
}: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  function handleSignOut() {
    clearSession();
    setUser(null);
    window.location.href = "/auth";
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  const rootClassName = [
    sticky ? "sticky top-0 z-30" : "",
    "border border-[#d6e88c] bg-white/95 px-4 py-3 backdrop-blur md:px-6",
    className,
  ]
    .join(" ")
    .trim();


  return (
    <header className={rootClassName}>
      <div className="flex items-center justify-between gap-3">
        <BrandLogo small={smallLogo} scale={logoScale} />

        {/* Desktop nav */}
        <nav aria-label="Navegação principal" className="hidden items-center gap-5 md:flex">
          {links.map((item) => (
            <NavLink key={`${item.label}-${item.href}`} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link
                href={user.role === "admin" ? "/admin" : user.role === "partner" ? "/partner" : "/consumer"}
                className="rounded-full border border-[#d9d9d9] bg-[#f8faf7] px-4 py-2.5 text-sm font-bold text-[#1b2a20] no-underline"
              >
                {user.role === "admin" ? "Admin" : user.role === "partner" ? "Painel" : user.name?.split(" ")[0] ?? "Minha conta"}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full bg-[var(--brand-accent)] px-4 py-2.5 text-sm font-black text-[#0f1a13]"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth?tab=login"
                className="rounded-full border border-[#d9d9d9] bg-[#f8faf7] px-4 py-2.5 text-sm font-bold text-[#1b2a20] no-underline"
              >
                Entrar
              </Link>
              <Link
                href="/auth?tab=register"
                className="rounded-full bg-[var(--brand-accent)] px-4 py-2.5 text-sm font-black text-[#0f1a13] no-underline"
              >
                Cadastrar
              </Link>
            </>
          )}
          {actionsSlot}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileOpen}
          className="flex items-center justify-center rounded-full border border-[#d6e88c] bg-white p-2 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {subtitle && (
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{subtitle}</p>
      )}

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div
          ref={mobileMenuRef}
          className="mt-3 grid gap-1 border border-[#d6e88c] bg-white p-3 md:hidden"
        >
          <nav aria-label="Navegação mobile" className="grid gap-1">
            {links.map((item) => (
              <NavLink
                key={`mobile-${item.label}-${item.href}`}
                href={item.href}
                onClick={() => setMobileOpen(false)}
              >
                <span className="block rounded-xl px-3 py-2 hover:bg-[#f8fbf4]">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-2 grid gap-2 border-t border-[#e7eddc] pt-2">
            {user ? (
              <>
                <Link
                  href={user.role === "admin" ? "/admin" : user.role === "partner" ? "/partner" : "/consumer"}
                  onClick={() => setMobileOpen(false)}
                  className="min-h-12 rounded-full border border-[#d9d9d9] bg-[#f8faf7] px-4 py-3 text-center text-sm font-bold text-[#1b2a20] no-underline"
                >
                  {user.role === "admin" ? "Admin" : user.role === "partner" ? "Painel" : user.name?.split(" ")[0] ?? "Minha conta"}
                </Link>
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); handleSignOut(); }}
                  className="min-h-12 rounded-full bg-[var(--brand-accent)] px-4 py-3 text-center text-sm font-black text-[#0f1a13]"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth?tab=login"
                  onClick={() => setMobileOpen(false)}
                  className="min-h-12 rounded-full border border-[#d9d9d9] bg-[#f8faf7] px-4 py-3 text-center text-sm font-bold text-[#1b2a20] no-underline"
                >
                  Entrar
                </Link>
                <Link
                  href="/auth?tab=register"
                  onClick={() => setMobileOpen(false)}
                  className="min-h-12 rounded-full bg-[var(--brand-accent)] px-4 py-3 text-center text-sm font-black text-[#0f1a13] no-underline"
                >
                  Cadastrar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
