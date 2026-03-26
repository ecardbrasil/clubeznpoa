import { PublicStaticPage } from "@/components/public-static-page";

export default function LgpdPage() {
  return (
    <PublicStaticPage
      subtitle="Legal"
      title="LGPD"
      description="Diretrizes de proteção de dados pessoais em conformidade com a legislação brasileira."
    >
      <p className="m-0 text-sm text-[#486048]">O titular pode solicitar acesso, correção e exclusão de dados pessoais.</p>
      <p className="m-0 text-sm text-[#486048]">Pedidos podem ser enviados para contato@clubezn.com.</p>
      <p className="m-0 text-sm text-[#486048]">Mantemos controles técnicos e organizacionais para segurança da informação.</p>
    </PublicStaticPage>
  );
}
