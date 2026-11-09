import Link from "next/link";
import { SearchX } from "lucide-react";
import { PublicPageHeader } from "@/components/public-page-header";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1400px] content-start gap-6 px-3 py-4 md:px-6 md:py-6 xl:px-8">
      <PublicPageHeader />
      <section className="mx-auto grid max-w-md justify-items-center gap-3 py-16 text-center">
        <SearchX size={44} aria-hidden="true" className="text-[var(--muted)]" />
        <h1 className="m-0 text-2xl font-bold text-[#0f1a13]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
          Página não encontrada
        </h1>
        <p className="m-0 text-sm text-[var(--muted)]">O endereço pode ter mudado ou não existe mais.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Link href="/ofertas" className="btn btn-primary !w-auto !px-5">Ver ofertas</Link>
          <Link href="/" className="btn btn-ghost !w-auto !px-5">Voltar ao início</Link>
        </div>
      </section>
    </main>
  );
}
