import { PublicStaticPage } from "@/components/public-static-page";

export default function TermsPage() {
  return (
    <PublicStaticPage
      title="Termos de uso"
      description="Condições gerais para utilização da plataforma ClubeZN."
    >
      <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
        <section>
          <p className="font-semibold text-foreground mb-2">1. Aceitação e Natureza do Serviço</p>
          <p>
            O uso da plataforma implica concordância total com estas regras. O ClubeZN atua como
            <strong> intermediador de anúncios</strong>, facilitando o encontro entre moradores da Zona Norte
            e empresas locais. Não realizamos moderação prévia das ofertas; portanto, a veracidade
            e a entrega dos produtos/serviços são de responsabilidade exclusiva do lojista.
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground mb-2">2. Idade Mínima e Cadastro</p>
          <p>
            Para utilizar o ClubeZN como Consumidor, tu deves ter no mínimo <strong>16 anos</strong>.
            Usuários entre 16 e 18 anos declaram estar assistidos por seus responsáveis legais.
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground mb-2">3. Dinâmica das Ofertas e Resgate</p>
          <p>
            O benefício é garantido pela geração de um código de 6 dígitos com validade de
            <strong> 10 minutos</strong>. Caso o parceiro não honre a oferta, o usuário deve resolver
            diretamente com o estabelecimento. Disponibilizamos um canal de denúncias para análise
            humana individual de casos de descumprimento.
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground mb-2">4. Uso de Dados e Comunicações (LGPD)</p>
          <p>
            Ao aceitar estes termos, tu autorizas o ClubeZN a utilizar teus dados de cadastro (E-mail e WhatsApp)
            para o envio de marketing, comunicações de ofertas e promoções, respeitando sempre a finalidade
            de conectar a comunidade local.
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground mb-2">5. Moderação e Segurança</p>
          <p>
            Reservamo-nos o direito de <strong>banir ou excluir</strong>, sem aviso prévio, qualquer
            usuário ou empresa em caso de fraude, conteúdo ofensivo ou uso indevido da plataforma.
          </p>
        </section>

        <section>
          <p className="font-semibold text-foreground mb-2">6. Disposições Finais (MVP)</p>
          <p>
            Esta plataforma está em fase de validação (MVP) e pode ser descontinuada ou alterada a qualquer
            momento, sem aviso prévio. Fica eleito o Foro de Porto Alegre/RS para resolver qualquer questão legal.
          </p>
        </section>
      </div>
    </PublicStaticPage>
  );
}