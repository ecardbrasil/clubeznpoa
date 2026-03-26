import Link from "next/link";
import { PublicStaticPage } from "@/components/public-static-page";

export default function HowItWorksPage() {
  return (
    <PublicStaticPage
      subtitle="Institucional"
      title="Como funciona o ClubeZN"
      description="Entenda o fluxo completo para moradores e empresas parceiras usarem a plataforma."
    >
      <h2 className="m-0 text-lg font-extrabold text-[#102113]">Para moradores</h2>
      <p className="m-0 text-sm text-[#486048]">1. Crie sua conta.</p>
      <p className="m-0 text-sm text-[#486048]">2. Escolha uma oferta por bairro e categoria.</p>
      <p className="m-0 text-sm text-[#486048]">3. Gere o código e valide no parceiro.</p>
      <h2 className="m-0 mt-1 text-lg font-extrabold text-[#102113]">Para empresas</h2>
      <p className="m-0 text-sm text-[#486048]">1. Cadastre sua empresa parceira.</p>
      <p className="m-0 text-sm text-[#486048]">2. Complete perfil, logo e contatos.</p>
      <p className="m-0 text-sm text-[#486048]">3. Publique ofertas e acompanhe os resultados no painel.</p>
      <Link href="/ofertas" className="btn btn-primary !w-full sm:!w-auto sm:min-w-44">
        Ver ofertas
      </Link>
    </PublicStaticPage>
  );
}
