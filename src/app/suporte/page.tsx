import { PublicStaticPage } from "@/components/public-static-page";

export default function SupportPage() {
  return (
    <PublicStaticPage
      subtitle="Links úteis"
      title="Fale com o suporte"
      description="Nosso time está disponível para ajudar moradores e empresas parceiras."
    >
      <p className="m-0 text-sm text-[var(--muted)]">E-mail: contato@clubezn.com</p>
      <p className="m-0 text-sm text-[var(--muted)]">WhatsApp: (51) 99999-0000</p>
      <p className="m-0 text-sm text-[var(--muted)]">Atendimento: segunda a sexta, das 9h às 18h.</p>
    </PublicStaticPage>
  );
}
