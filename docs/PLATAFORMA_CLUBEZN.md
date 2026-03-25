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

## 7) Identidade visual (diretriz atual)
- Estilo **2D flat**
- Cor oficial da identidade visual ClubeZN: **#C9F549**
- Aplicar o verde **#C9F549** em banners e secoes de destaque
- Evitar gradientes e excesso de efeitos
- Aplicacao consistente da logomarca em cabecalho e rodape

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
