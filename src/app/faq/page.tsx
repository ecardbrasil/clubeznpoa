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
        <details key={item.question} className="rounded-xl border border-[#d5e4d8] bg-white px-4 py-3">
          <summary className="cursor-pointer text-sm font-extrabold text-[#19321f]">{item.question}</summary>
          <p className="m-0 mt-2 text-sm leading-relaxed text-[#486048]">{item.answer}</p>
        </details>
      ))}
    </PublicStaticPage>
  );
}
