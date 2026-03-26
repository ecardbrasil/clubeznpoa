import { PublicStaticPage } from "@/components/public-static-page";

export default function StatusPage() {
  return (
    <PublicStaticPage
      subtitle="Links úteis"
      title="Status da plataforma"
      description="Acompanhe a disponibilidade dos serviços do ClubeZN."
    >
      <div className="rounded-xl border border-[#d5e4d8] bg-white px-4 py-3">
        <p className="m-0 text-sm font-bold text-[#1f5f30]">Aplicação web: operacional</p>
      </div>
      <div className="rounded-xl border border-[#d5e4d8] bg-white px-4 py-3">
        <p className="m-0 text-sm font-bold text-[#1f5f30]">API de ofertas e parceiros: operacional</p>
      </div>
      <p className="m-0 text-xs text-[#5f7463]">Última atualização: em tempo real durante o uso da plataforma.</p>
    </PublicStaticPage>
  );
}
