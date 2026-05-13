import Link from "next/link";
import { Heart, Mail, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const footerLinks = {
  ofertas: [
    { label: "Todas as ofertas", href: "/ofertas" },
    { label: "Parceiros", href: "/parceiros" },
    { label: "Como funciona", href: "/sobre" },
    { label: "FAQ", href: "/faq" },
  ],
  institucional: [
    { label: "Sobre nós", href: "/sobre" },
    { label: "LGPD", href: "/lgpd" },
    { label: "Privacidade", href: "/privacidade" },
    { label: "Termos de uso", href: "/termos-de-uso" },
    { label: "Suporte", href: "/suporte" },
  ],
};

export function Footer() {
  return (
    <footer className="czn-footer">
      <div className="max-w-7xl mx-auto px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Col 1: Brand */}
          <div className="md:col-span-1 space-y-4">
            <BrandLogo small />
            <p className="text-sm leading-relaxed text-[#9db8a8]" style={{ fontFamily: "var(--font-dm)" }}>
              Conectamos moradores e empresas da Zona Norte de Porto Alegre com ofertas reais e
              locais.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com/clubeznpoa"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/8 transition-all hover:border-[#C9F549] hover:text-[#C9F549]"
                style={{ background: "rgba(255,255,255,0.06)" }}
                aria-label="Instagram ClubeZN"
              >
                <Heart size={16} />
              </a>
              <a
                href="mailto:contato@clubezn.com"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/8 transition-all hover:border-[#C9F549] hover:text-[#C9F549]"
                style={{ background: "rgba(255,255,255,0.06)" }}
                aria-label="Email ClubeZN"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Col 2: Ofertas */}
          <div className="space-y-3">
            <p
              className="text-xs font-black uppercase tracking-[0.1em] text-white"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Ofertas
            </p>
            <ul className="space-y-2">
              {footerLinks.ofertas.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm" style={{ fontFamily: "var(--font-dm)" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Institucional */}
          <div className="space-y-3">
            <p
              className="text-xs font-black uppercase tracking-[0.1em] text-white"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Institucional
            </p>
            <ul className="space-y-2">
              {footerLinks.institucional.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm" style={{ fontFamily: "var(--font-dm)" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contato */}
          <div className="space-y-3">
            <p
              className="text-xs font-black uppercase tracking-[0.1em] text-white"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Contato
            </p>
            <div className="space-y-2 text-sm" style={{ fontFamily: "var(--font-dm)" }}>
              <a href="mailto:contato@clubezn.com" className="block">
                contato@clubezn.com
              </a>
              <div className="flex items-center gap-1.5 text-[#9db8a8]">
                <MapPin size={13} style={{ color: "#C9F549" }} />
                <span>Zona Norte, Porto Alegre/RS</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-[#9db8a8]" style={{ fontFamily: "var(--font-dm)" }}>
            © {new Date().getFullYear()} ClubeZN. Todos os direitos reservados.
          </p>
          <p className="text-xs text-[#9db8a8]" style={{ fontFamily: "var(--font-dm)" }}>
            Construído com foco na Zona Norte de Porto Alegre.
          </p>
        </div>
      </div>
    </footer>
  );
}