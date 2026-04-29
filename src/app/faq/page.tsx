import { PublicStaticPage } from "@/components/public-static-page";

const faqItems = [
  {
    question: "O ClubeZN é gratuito?",
    answer: "Sim. O uso para moradores é gratuito.",
  },
  {
    question: "Como resgato uma oferta?",
    answer: "Escolha a oferta, gere o código e valide no parceiro participante.",
  },
  {
    question: "Quem pode participar?",
    answer: "Moradores da Zona Norte e empresas parceiras aprovadas pela plataforma.",
  },
  {
    question: "Posso divulgar minha empresa no ClubeZN?",
    answer: "Sim. Faça o cadastro como parceiro e complete o onboarding no painel.",
  },
];

export default function FaqPage() {
  return (
    <PublicStaticPage
      subtitle="Suporte"
      title="Perguntas frequentes"
      description="Respostas rápidas para dúvidas comuns sobre a plataforma."
    >
      {faqItems.map((item) => (
        <details
          key={item.question}
          className="group rounded-xl border border-[var(--line)] bg-white px-4 py-3 transition-all duration-200 open:border-[#c9f549] open:bg-[#f8fbf4]"
        >
          <summary
            className="cursor-pointer list-none flex items-center justify-between gap-3"
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
          >
            <span className="text-sm font-bold text-[#0f1a13]">{item.question}</span>
            <span
              className="flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 group-open:rotate-45"
              style={{ background: "linear-gradient(135deg, #c9f549 0%, #a8d63a 100%)", color: "#0f1a13" }}
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <p className="m-0 mt-2 text-sm leading-relaxed text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
            {item.answer}
          </p>
        </details>
      ))}
    </PublicStaticPage>
  );
}
