import Link from "next/link";
import { PublicStaticPage } from "@/components/public-static-page";

export default function BecomePartnerPage() {
  return (
    <PublicStaticPage
      subtitle="Links úteis"
      title="Seja parceiro ClubeZN"
      description="Leve sua empresa para a vitrine da Zona Norte e publique ofertas para novos clientes."
    >
      <p className="m-0 text-sm text-[#486048]">Cadastro simples, painel de gestão e visibilidade local para o seu negócio.</p>
      <Link href="/auth" className="btn btn-primary !w-full sm:!w-auto sm:min-w-48">
        Cadastrar empresa parceira
      </Link>
    </PublicStaticPage>
  );
}
