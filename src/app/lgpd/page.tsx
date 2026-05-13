import { PublicStaticPage } from "@/components/public-static-page";

export default function LgpdPage() {
  return (
    <PublicStaticPage
      title="LGPD - Lei Geral de Proteção de Dados"
      description="Política de privacidade e proteção de dados pessoais em conformidade com a legislação brasileira"
    >
      <h2 className="text-xl font-bold mt-6 mb-4">1. Introdução</h2>
      <p className="mb-4">
        A presente Política de Privacidade tem como objetivo principal informar como coletamos, 
        utilizamos, compartilhamos e protegemos os dados pessoais dos nossos usuários, 
        em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
      </p>

      <h2 className="text-xl font-bold mt-6 mb-4">2. Dados Coletados</h2>
      <p className="mb-4">
        Coletamos apenas os dados estritamente necessários para a prestação dos nossos serviços, 
        como nome, e-mail, telefone e informações de pagamento, quando aplicável.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-4">3. Finalidade da Coleta</h2>
      <p className="mb-4">
        Os dados são coletados para viabilizar a prestação do serviço contratado, 
        incluindo criação de cadastros, processamento de pagamentos, atendimento e 
        melhorias contínuas em nossa plataforma.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-4">4. Compartilhamento de Dados</h2>
      <p className="mb-4">
        Podemos compartilhar dados pessoais apenas com terceiros autorizados e 
        estritamente necessários para a prestação do serviço, como instituições 
        financeiras e parceiros comerciais, sempre respeitando os limites da lei.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-4">5. Direitos do Titular</h2>
      <p className="mb-2">Conforme a LGPD, o titular dos dados tem os seguintes direitos:</p>
      <ul className="list-disc pl-6 mb-4">
        <li className="mb-2">Confirmar a existência de tratamento de dados</li>
        <li className="mb-2">Acessar seus dados pessoais</li>
        <li className="mb-2">Corrigir dados incompletos, inexatos ou desatualizados</li>
        <li className="mb-2">Obter a eliminação dos dados pessoais tratados com seu consentimento</li>
        <li className="mb-2">Revogar o consentimento ao tratamento de dados</li>
        <li className="mb-2">Solicitar a portabilidade dos dados</li>
      </ul>

      <h2 className="text-xl font- mt-6 mb-4">6. Medidas de Segurança</h2>
      <p className="mb-4">
        Implementamos medidas técnicas e administrativas para proteger os dados pessoais 
        contra acessos não autorizados, como criptografia, controle de acesso, 
        monitoramento contínuo e políticas de segurança rigorosas.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-4">7. Prazo de Armazenamento</h2>
      <p className="mb-4">
        Os dados pessoais são armazenados durante o tempo necessário para atender 
        às finalidades para as quais foram coletados, conforme exigido pela legislação.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-4">8. Como Exercer os Direitos</h2>
      <p className="mb-4">
        O titular dos dados pode exercer seus direitos através do canal:
        <br />
        <a href="mailto:contato@clubezn.com" className="text-blue-600 hover:underline">
          contato@clubezn.com
        </a>
      </p>
      <p className="m-0 text-sm text-[var(--muted)]">
        Solicitações serão atendidas em até 10 dias úteis, conforme previsto em lei.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-4">9. Canal de Comunicação</h2>
      <p className="mb-4">
        Dúvidas, solicitações ou sugestões sobre esta política podem ser enviadas para:
        <br />
        <a href="mailto:contato@clubezn.com" className="text-blue-600 hover:underline">
          contato@clubezn.com
        </a>
      </p>
    </PublicStaticPage>
  );
}
