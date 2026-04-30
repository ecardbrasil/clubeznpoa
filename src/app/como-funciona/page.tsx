import Link from "next/link";
import { PublicStaticPage } from "@/components/public-static-page";

const steps = {
  residents: [
    { n: "1", text: "Crie sua conta." },
    { n: "2", text: "Escolha uma oferta por bairro e categoria." },
    { n: "3", text: "Gere o código e valide no parceiro." },
  ],
  companies: [
    { n: "1", text: "Cadastre sua empresa parceira." },
    { n: "2", text: "Complete perfil, logo e contatos." },
    { n: "3", text: "Publique ofertas e acompanhe os resultados no painel." },
  ],
};

export default function HowItWorksPage() {
  return (
    <PublicStaticPage
      title="Como funciona o ClubeZN"
      description="Entenda o fluxo completo para moradores e empresas parceiras usarem a plataforma."
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black text-[#0f1a13]"
              style={{ background: "linear-gradient(135deg, #c9f549 0%, #a8d63a 100%)", fontFamily: "var(--font-poppins), sans-serif" }}
              aria-hidden="true"
            >
              M
            </span>
            <h2 className="m-0 text-lg font-bold text-[#0f1a13]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
              Para moradores
            </h2>
          </div>
          <div className="grid gap-2 pl-9">
            {steps.residents.map((step) => (
              <div key={step.n} className="flex items-start gap-3">
                <span
                  className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-black text-[#0f1a13]"
                  style={{ background: "linear-gradient(135deg, #c9f549 0%, #a8d63a 100%)", fontFamily: "var(--font-poppins), sans-serif" }}
                >
                  {step.n}
                </span>
                <p className="m-0 text-sm text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-[var(--line)]" aria-hidden="true" />

        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black text-[#0f1a13]"
              style={{ background: "linear-gradient(135deg, #c9f549 0%, #a8d63a 100%)", fontFamily: "var(--font-poppins), sans-serif" }}
              aria-hidden="true"
            >
              E
            </span>
            <h2 className="m-0 text-lg font-bold text-[#0f1a13]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
              Para empresas
            </h2>
          </div>
          <div className="grid gap-2 pl-9">
            {steps.companies.map((step) => (
              <div key={step.n} className="flex items-start gap-3">
                <span
                  className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-black text-[#0f1a13]"
                  style={{ background: "linear-gradient(135deg, #c9f549 0%, #a8d63a 100%)", fontFamily: "var(--font-poppins), sans-serif" }}
                >
                  {step.n}
                </span>
                <p className="m-0 text-sm text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Link href="/ofertas" className="btn btn-primary !w-full sm:!w-auto sm:min-w-44">
            Ver ofertas
          </Link>
        </div>
      </div>
    </PublicStaticPage>
  );
}
