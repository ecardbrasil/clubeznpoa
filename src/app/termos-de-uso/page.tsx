import { PublicStaticPage } from "@/components/public-static-page";

export default function TermsPage() {
  return (
    <PublicStaticPage
      subtitle="Legal"
      title="Termos de uso"
      description="Condições gerais para utilização da plataforma ClubeZN."
    >
      <p className="m-0 text-sm text-[#486048]">O uso da plataforma implica concordância com as regras de uso e políticas vigentes.</p>
      <p className="m-0 text-sm text-[#486048]">As ofertas são responsabilidade das empresas parceiras e podem sofrer alteração sem aviso prévio.</p>
      <p className="m-0 text-sm text-[#486048]">O ClubeZN pode atualizar estes termos sempre que necessário.</p>
    </PublicStaticPage>
  );
}
