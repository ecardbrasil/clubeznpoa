import { PublicStaticPage } from "@/components/public-static-page";

export default function SupportPage() {
  return (
    <PublicStaticPage
      subtitle="Links úteis"
      title="Fale com o suporte"
      description="Nosso time está disponível para ajudar moradores e empresas parceiras."
    >
      <p className="m-0 text-sm text-[#486048]">E-mail: contato@clubezn.com</p>
      <p className="m-0 text-sm text-[#486048]">WhatsApp: (51) 99999-0000</p>
      <p className="m-0 text-sm text-[#486048]">Atendimento: segunda a sexta, das 9h às 18h.</p>
    </PublicStaticPage>
  );
}
