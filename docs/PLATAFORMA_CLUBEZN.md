# Plataforma ClubeZN - Resumo Executivo e Direcionadores

## 1) O que e o ClubeZN
O **ClubeZN** e uma plataforma de vantagens e descontos para moradores da **Zona Norte de Porto Alegre/RS**.
A proposta e conectar consumidores locais a empresas parceiras da regiao, com resgate simples de beneficios e controle administrativo centralizado.

## 2) Objetivo do MVP
Entregar rapidamente uma versao funcional web (mobile-first) que valide:
- interesse do consumidor por ofertas locais,
- adesao de parceiros comerciais,
- capacidade de operacao com aprovacao e controle via admin.

## 3) Perfis de usuario
A plataforma tem 3 perfis principais:

1. **Consumidor**
- Busca ofertas aprovadas
- Gera codigo de resgate
- Visualiza historico de uso

2. **Empresa Parceira**
- Cadastra empresa e ofertas
- Aguarda aprovacao administrativa
- Valida codigo de beneficio
- Acompanha resgates e ofertas proprias

3. **Administrador**
- Aprova empresas parceiras
- Aprova ofertas
- Monitora indicadores basicos (resgates, empresas ativas, ofertas mais usadas)

## 4) Funcionalidades atuais do MVP

### 4.1 Landing publica (/)
- Apresentacao do ClubeZN
- Seções de valor da plataforma
- Vitrine de ofertas em destaque
- CTA para entrar/cadastrar

### 4.2 Autenticacao (/auth)
- Login com email ou celular + senha
- Cadastro de consumidor
- Cadastro de parceiro (com dados da empresa)

### 4.3 Area do consumidor (/consumer)
- Lista de ofertas aprovadas
- Filtro por texto (titulo, bairro, categoria)
- Geração de codigo de resgate (6 digitos)
- Visualizacao de codigo ativo com validade
- Historico de resgates

### 4.4 Area da empresa parceira (/partner)
- Status de aprovacao da empresa
- Cadastro de nova oferta (pendente de aprovacao)
- Validacao de codigo de resgate
- Historico de resgates da empresa
- Lista de ofertas da propria empresa

### 4.5 Area do administrador (/admin)
- Dashboard com KPI basico:
  - resgates confirmados
  - empresas ativas
  - ofertas mais usadas
- Aprovacao de empresas pendentes
- Aprovacao de ofertas pendentes

## 5) Regras de negocio atuais
- Login por email/celular + senha (sem OTP neste MVP)
- Ofertas e empresas so ficam visiveis apos aprovacao do admin
- Resgate via codigo numerico de 6 digitos
- Codigo expira em 10 minutos
- Codigo so pode ser validado pela empresa dona da oferta

## 6) Direcionadores de produto (nortes)

### 6.1 Norte de UX
- Prioridade para uso em celular (mobile-first)
- Fluxo curto para encontrar e resgatar oferta
- Linguagem simples e direta

### 6.2 Norte de operacao
- Curadoria e controle central via admin
- Evitar friccao para parceiro cadastrar oferta
- Rapida aprovacao para aumentar volume de beneficios validos

### 6.3 Norte comercial
- Foco em densidade local (Zona Norte)
- Destaque inicial para Sarandi
- Crescimento por rede de parceiros por bairro/categoria

## 7) Identidade visual (diretriz atual)
- Estilo **2D flat**
- Cor oficial da identidade visual ClubeZN: **#C9F549**
- Aplicar o verde **#C9F549** em banners e seções de destaque
- Evitar gradientes e excesso de efeitos
- Aplicacao consistente da logomarca em cabecalho e rodape

## 8) Arquitetura tecnica atual (MVP)
- Frontend: Next.js (App Router)
- Estilizacao: Tailwind + CSS global
- Persistencia: localStorage (modo demo)
- Build/deploy: pronto para Vercel

## 9) Limitacoes conhecidas do MVP
- Sem backend real (dados locais do navegador)
- Sem LGPD completa (consentimento/auditoria/retencao formal)
- Sem integracao de notificacao (SMS, WhatsApp, email transacional)
- Sem painel analitico avancado

## 10) Proximos passos recomendados (pos-MVP)
1. Migrar persistencia para backend (Supabase/Postgres)
2. Implementar autenticacao robusta (OTP celular + recuperacao de senha)
3. Criar modulo de termos/LGPD
4. Incluir relatorios operacionais e comerciais avancados
5. Implantar dominio e ambiente de producao

## 11) Criterios de sucesso iniciais
- Quantidade de usuarios cadastrados
- Empresas parceiras aprovadas
- Ofertas ativas
- Taxa de resgate por oferta
- Tempo medio entre cadastro do parceiro e primeira oferta aprovada

---

## Referencia rapida de rotas
- `/` Landing publica
- `/auth` Login e cadastro
- `/consumer` Area do consumidor
- `/partner` Area da empresa parceira
- `/admin` Area do administrador
