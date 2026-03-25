# Checklist de Melhorias do Sistema

Ultima atualizacao: 2026-03-25

## Ja implementado

- [x] Landing publica com vitrine de ofertas
- [x] Fluxo de autenticacao (`/auth`) para consumidor e parceiro
- [x] Areas separadas para `consumer`, `partner` e `admin`
- [x] Publicacao imediata de empresas e ofertas (sem aprovacao manual)
- [x] Geração e validacao de codigo de resgate (6 digitos, 10 min)
- [x] Upload de fotos da oferta (ate 5) com selecao de capa no cadastro da oferta
- [x] Perfil publico do parceiro com nome, bio, redes sociais, logo e capa
- [x] Opcao no perfil do parceiro para marcar que nao possui endereco fisico
- [x] Exibicao de dados publicos do parceiro (logo/capa/endereco/redes) na landing e no detalhe da oferta
- [x] Distancia aproximada no detalhe da oferta quando localizacao estiver disponivel
- [x] Mapa com pin no detalhe da oferta quando houver endereco fisico da empresa
- [x] Sidebar componentizada no painel do parceiro
- [x] Sidebar componentizada no painel do admin (padrao unificado de navegacao)
- [x] Secao de clientes no painel do parceiro (clientes que geraram codigo)
- [x] Pagina publica dedicada de ofertas (`/ofertas`) com filtros por bairro, categoria e parceiro
- [x] Ordenacao de desconto por valor numerico (nao lexicografica)
- [x] Colecoes da home clicaveis com redirecionamento para `/ofertas` com filtro aplicado
- [x] Secao de bairros da Zona Norte com mapa e links por bairro
- [x] Dropdown de bairros da Zona Norte no cadastro de consumidor e parceiro
- [x] Depoimentos curtos e selos de confianca na landing
- [x] Preparacao da infraestrutura para Supabase/Vercel (`.env.example`, `supabase/schema.sql`, cliente Supabase e guia de setup)
- [x] Sessao de API com token assinado (`Bearer`) e validacao de papel por rota
- [x] Hash de senha (`scrypt`) no fluxo Supabase com migracao automatica de senha legada
- [x] Remocao de senha do objeto `User` retornado ao frontend
- [x] Melhorar feedback de erro/sucesso com toasts padronizados

## Proximas melhorias (prioridade alta)

- [ ] Adicionar busca e filtros na secao `Clientes` (nome, email, telefone, periodo)
- [ ] Exportar relatorio CSV na area do parceiro (resgates e clientes)
- [ ] Paginar listagens com volume maior (resgates, clientes, ofertas)

## Planejamento sugerido (sprints)

### Sprint 1 (1 semana)

- [ ] Adicionar busca e filtros na secao `Clientes`
  - Estimativa: 1 dia
  - Entrega: filtro por nome/email/telefone e periodo funcionando sem recarregar pagina
- [ ] Exportar relatorio CSV na area do parceiro (resgates e clientes)
  - Estimativa: 1,5 dia
  - Entrega: download de CSV com colunas principais e filtros aplicados
- [ ] Buffer de QA e ajustes
  - Estimativa: 1 dia
  - Entrega: validacao manual dos fluxos `consumer`, `partner` e `admin`

Total estimado Sprint 1: 3,5 dias uteis

### Sprint 2 (1 semana)

- [ ] Paginar listagens com volume maior (resgates, clientes, ofertas)
  - Estimativa: 1,5 a 2 dias
  - Entrega: paginação consistente com estado de pagina e tamanho por pagina
- [ ] Hardening de performance/UX das listagens
  - Estimativa: 1 dia
  - Entrega: listas sem travamento perceptivel em volume alto
- [ ] QA final + ajustes
  - Estimativa: 1 dia
  - Entrega: checklist de regressao dos fluxos principais aprovado

Total estimado Sprint 2: 3,5 a 4 dias uteis

## Proximas melhorias (prioridade media)

- [ ] Persistencia real unica com backend (descontinuar modo local para producao)
- [ ] Autenticacao robusta (OTP celular + recuperacao de senha)
- [ ] Controle de permissao por papel no backend (RBAC completo)
- [ ] Auditoria de acoes sensiveis (validacoes, alteracoes de perfil, operacoes administrativas)
- [ ] Painel admin com filtros por bairro/categoria e periodo

## Melhorias da pagina inicial (landing)

- [ ] Confianca e prova social
  - Exibir numeros reais: parceiros ativos, ofertas publicadas e resgates concluidos
- [ ] Descoberta de ofertas
  - Adicionar filtros na landing (bairro, categoria e faixa de desconto)
  - Incluir ordenacao por "mais usadas" e "novas"
- [ ] Cards de oferta com foco em conversao
  - Destacar validade, bairro e economia estimada
  - Exibir CTA principal sem depender de abrir modal
- [ ] Secao de parceiros mais util
  - Transformar em vitrine clicavel por parceiro
  - Mostrar logo, especialidade e bairro
- [ ] SEO local
  - Melhorar metadados por contexto local (bairros da Zona Norte)
  - Adicionar dados estruturados (`LocalBusiness` e `Offer`)
- [ ] Performance mobile
  - Otimizar imagens de capa/logo para reduzir LCP
  - Aplicar lazy load e skeleton loading em listagens
- [x] Acessibilidade
  - [x] Ajustar contraste e estados de foco visiveis
  - [x] Garantir navegacao por teclado nos principais fluxos

## Proximas melhorias (prioridade baixa)

- [ ] SEO da landing (metadados, OG tags, sitemap)
- [ ] Testes automatizados (unitarios e e2e)
- [ ] Observabilidade (logs, metricas, rastreamento de erro)
- [ ] Internacionalizacao e acessibilidade avancada

## Criterio de pronto para sair de MVP

- [ ] Persistencia fora de `localStorage`
- [ ] Autenticacao e autorizacao em producao
- [ ] Logs e trilha de auditoria para admin/parceiro
- [ ] Testes criticos cobrindo login, geracao e validacao de codigo
- [ ] Pipeline de deploy com validacao automatica (lint + build + testes)
