import { PublicStaticPage } from "@/components/public-static-page";

export default function PrivacyPage() {
  return (
    <PublicStaticPage
      subtitle="Legal"
      title="Política de privacidade"
      description="Como coletamos, utilizamos e protegemos seus dados pessoais."
    >
      <p className="m-0 text-sm text-[var(--muted)]">Coletamos apenas dados necessários para autenticação, uso da plataforma e atendimento.</p>
      <p className="m-0 text-sm text-[var(--muted)]">Não comercializamos dados pessoais com terceiros.</p>
      <p className="m-0 text-sm text-[var(--muted)]">Você pode solicitar atualização ou exclusão de dados pelos canais oficiais de suporte.</p>
    </PublicStaticPage>
  );
}
