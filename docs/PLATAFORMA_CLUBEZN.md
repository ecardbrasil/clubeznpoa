# Plataforma ClubeZN - Resumo Executivo e Direcionadores

## 1) O que e o ClubeZN
O **ClubeZN** e uma plataforma de vantagens e descontos para moradores da **Zona Norte de Porto Alegre/RS**.
A proposta e conectar consumidores locais a empresas parceiras da regiao, com resgate simples de beneficios e controle administrativo centralizado.

## 2) Objetivo do MVP
Entregar rapidamente uma versao funcional web (mobile-first) que valide:
- interesse do consumidor por ofertas locais,
- adesao de parceiros comerciais,
- capacidade de operacao com fluxo simples e monitoramento via admin (sem moderacao manual).

## 3) Perfis de usuario
A plataforma tem 3 perfis principais:

1. **Consumidor**
- Busca ofertas ativas
- Gera codigo de resgate
- Visualiza historico de uso
- No detalhe da oferta, pode ver distancia aproximada e mapa da empresa (quando houver endereco fisico)

2. **Empresa Parceira**
- Cadastra empresa e ofertas com publicacao imediata
- Define perfil publico (nome, bio, redes, logo, capa)
- Pode informar que nao possui endereco fisico
- Valida codigo de beneficio
- Acompanha resgates e ofertas proprias

3. **Administrador**
- Monitora indicadores basicos (resgates, empresas ativas, ofertas mais usadas)
- Consulta cadastros de empresas e ofertas (sem fluxo de aprovacao/rejeicao)

## 4) Funcionalidades atuais do MVP

### 4.1 Landing publica (/)
- Apresentacao do ClubeZN
- Secoes de valor da plataforma
- Vitrine de ofertas em destaque
- CTA para entrar/cadastrar

### 4.2 Autenticacao (/auth)
- Login com email ou celular + senha
- Cadastro de consumidor
- Cadastro de parceiro (com dados da empresa)

### 4.3 Area do consumidor (/consumer)
- Redirecionamento para vitrine de ofertas (`/ofertas`)
- Filtros por texto, bairro, categoria e parceiro
- Geracao de codigo de resgate (6 digitos)
- Visualizacao de codigo ativo com validade
- Historico de resgates

### 4.4 Area da empresa parceira (/partner)
- Edicao de perfil publico
- Opcao de empresa sem endereco fisico
- Cadastro de nova oferta (publicacao imediata)
- Validacao de codigo de resgate
- Historico de resgates da empresa
- Lista de ofertas da propria empresa

### 4.5 Area do administrador (/admin)
- Dashboard com KPI basico:
  - resgates confirmados
  - empresas ativas
  - ofertas mais usadas
- Listagem de empresas
- Listagem de ofertas

## 5) Regras de negocio atuais
- Login por email/celular + senha (sem OTP neste MVP)
- Empresas e ofertas sao publicadas sem aprovacao manual
- Resgate via codigo numerico de 6 digitos
- Codigo expira em 10 minutos
- Codigo so pode ser validado pela empresa dona da oferta
- Mapa no detalhe da oferta so aparece quando a empresa possui endereco fisico informado

## 6) Direcionadores de produto (nortes)

### 6.1 Norte de UX
- Prioridade para uso em celular (mobile-first)
- Fluxo curto para encontrar e resgatar oferta
- Linguagem simples e direta

### 6.2 Norte de operacao
- Menor friccao para parceiro cadastrar oferta
- Monitoramento central via admin
- Evolucao gradual para controles operacionais mais avancados

### 6.3 Norte comercial
- Foco em densidade local (Zona Norte)
- Destaque inicial para Sarandi
- Crescimento por rede de parceiros por bairro/categoria

## 7) Identidade visual (padrao oficial)

Estas diretrizes devem ser seguidas em todas as paginas publicas e internas do produto.

### 7.1 Direcao visual
- Estilo **2D flat**
- Visual moderno, limpo, leve e confiavel
- Prioridade para **mobile-first**
- Linguagem visual comercial com foco local (Zona Norte)
- Evitar poluicao visual, excesso de efeitos e elementos decorativos desnecessarios

### 7.2 Paleta e destaque
- Cor oficial de destaque: **#C9F549**
- Uso principal da cor de destaque:
  - CTAs primarios
  - selos e chamadas de destaque
  - blocos estrategicos de conversao
- Cores de apoio devem manter contraste e leitura confortavel
- Evitar gradientes agressivos; preferir fundos claros e neutros

### 7.3 Componentes base (consistencia de interface)
- **Botoes**:
  - formato arredondado (pill/round)
  - CTA primario com destaque em **#C9F549**
  - CTA secundario em estilo neutro/ghost
- **Cards**:
  - fundo claro
  - borda suave
  - sombra discreta
  - espacamento interno consistente
- **Badges/Selos**:
  - curtos, legiveis e com contraste adequado
- **Formularios**:
  - campos com borda clara
  - foco visivel
  - feedback de erro/sucesso objetivo

### 7.4 Estrutura de pagina
- Header com logomarca sempre visivel
- Navegacao clara e curta
- Footer com mensagem institucional objetiva e contato/localidade
- Hierarquia de conteudo com titulos curtos e textos escaneaveis

### 7.4.1 Header global reutilizavel (regra obrigatoria)
- O cabecalho do site deve usar um unico componente reutilizavel.
- Referencia tecnica:
  - `src/components/site-header.tsx` (componente base)
  - `src/components/public-page-header.tsx` (wrapper para paginas publicas)
- A landing (`/`) e as paginas publicas devem manter o mesmo padrao visual e estrutural de header.

### 7.4.2 Comportamento do header por sessao
- Usuario deslogado:
  - exibir acoes `Entrar` e `Cadastrar empresa`.
- Usuario logado:
  - ocultar `Entrar` e `Cadastrar empresa`.
  - exibir `Meu painel` e `Sair`.
- A navegacao deve adaptar o item de acesso:
  - deslogado: `Entrar`
  - logado: `Meu painel`

### 7.4.3 Consistencia entre paginas
- Evitar headers locais duplicados por pagina.
- Novas paginas devem reutilizar o header global, sem recriar variacoes visuais isoladas.
- Excecoes so podem ocorrer quando houver justificativa funcional clara (ex.: area interna com sidebar propria).

### 7.5 Diretriz de copy
- Tom direto, confiavel, local e convidativo
- Mensagens curtas, com foco em acao
- Reforcar valor para os dois lados da plataforma:
  - morador: praticidade + economia local
  - parceiro: visibilidade + movimento comercial

### 7.6 Regra de manutencao
- Novas paginas e refactors devem seguir este padrao visual antes de serem consideradas concluidas.
- Em caso de duvida, a landing (`/`) e o CSS global sao a referencia primaria de estilo.

## 8) Arquitetura tecnica atual (MVP)
- Frontend: Next.js (App Router)
- Estilizacao: Tailwind + CSS global
- Persistencia: localStorage (modo demo) e Supabase (modo remoto)
- API interna com sessao por token assinado
- Build/deploy: pronto para Vercel

## 9) Seguranca atual do MVP
- Token de sessao da API assinado (Bearer)
- Validacao de papel por rota (`admin`, `partner`, `consumer`)
- Hash de senha no fluxo Supabase (`scrypt`)
- Migracao automatica de senha legada em texto puro no login (quando detectada)
- Campo de senha nao e retornado no `User` enviado ao frontend

## 10) Limitacoes conhecidas do MVP
- `localStorage` ainda existe como modo demo
- Sem LGPD completa (consentimento/auditoria/retencao formal)
- Sem integracao de notificacao (SMS, WhatsApp, email transacional)
- Sem painel analitico avancado

## 11) Proximos passos recomendados (pos-MVP)
1. Consolidar operacao 100% em Supabase e reduzir dependencia do modo local
2. Implementar autenticacao robusta (OTP celular + recuperacao de senha)
3. Criar modulo de termos/LGPD
4. Incluir relatorios operacionais e comerciais avancados
5. Implantar dominio e ambiente de producao

## 12) Criterios de sucesso iniciais
- Quantidade de usuarios cadastrados
- Empresas parceiras ativas
- Ofertas ativas
- Taxa de resgate por oferta
- Tempo medio entre cadastro do parceiro e primeira oferta publicada

---

## Referencia rapida de rotas
- `/` Landing publica
- `/auth` Login e cadastro
- `/consumer` Area do consumidor
- `/partner` Area da empresa parceira
- `/admin` Area do administrador
