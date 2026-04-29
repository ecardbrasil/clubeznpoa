# ClubeZN MVP - Documentação do Projeto

## Stack Tecnológico

- **Framework**: Next.js 16.2.0 (App Router)
- **UI Library**: React 19.2.4
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS 4 + PostCSS
- **Animation**: Framer Motion 12.38.0
- **Icons**: Lucide React 1.0.1
- **Language**: TypeScript 5
- **Linter**: ESLint 9

## Estrutura do Projeto

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes (server-side)
│   │   ├── auth/             # Autenticação
│   │   ├── admin/            # Admin endpoints
│   │   ├── consumer/         # Consumer endpoints
│   │   └── partner/          # Partner endpoints
│   ├── auth/                 # Página de login
│   ├── admin/                # Painel administrativo
│   ├── consumer/             # Área do consumidor
│   ├── partner/              # Área do parceiro
│   ├── ofertas/              # Listagem de ofertas
│   ├── parceiros/            # Perfil dos parceiros
│   ├── como-funciona/        # Página informativa
│   ├── faq/                  # FAQ
│   ├── lgpd/                 # Política LGPD
│   ├── privacidade/          # Política de privacidade
│   ├── suporte/              # Página de suporte
│   ├── termos-de-uso/        # Termos de uso
│   ├── layout.tsx            # Layout raiz
│   ├── page.tsx              # Home page
│   └── globals.css           # Estilos globais
├── components/               # Componentes React reutilizáveis
│   ├── ui/                   # Componentes de UI básicos
│   ├── admin/                # Componentes específicos de admin
│   ├── consumer/             # Componentes específicos de consumer
│   ├── partner/              # Componentes específicos de partner
│   ├── brand-logo.tsx
│   ├── offer-card.tsx
│   ├── site-header.tsx       # Header compartilhado (com auth awareness)
│   └── public-static-page.tsx
└── lib/                      # Utilitários e lógica compartilhada
    ├── supabase/             # Clientes Supabase (client/server)
    ├── server-auth.ts        # Autenticação server-side
    ├── types.ts              # Tipos TypeScript
    ├── utils.ts              # Funções auxiliares
    └── runtime-config.ts     # Configurações de runtime

supabase/
├── schema.sql                # Schema do banco de dados
└── seed.sql                  # Dados iniciais

tailwind.config.ts            # Configuração Tailwind
tsconfig.json                 # Configuração TypeScript
next.config.mjs               # Configuração Next.js
```

## Convenções de Código

### Naming Conventions
- **Componentes**: PascalCase (`SiteHeader.tsx`, `OfferCard.tsx`)
- **Arquivos utilitários**: camelCase (`utils.ts`, `types.ts`)
- **Variáveis/funções**: camelCase
- **Constantes**: UPPER_SNAKE_CASE (quando apropriado)
- **Tipos/Interfaces**: PascalCase

### Padrão de Componentes
- Componentes funcionais com hooks
- Props bem tipadas com TypeScript
- Export padrão para componentes
- Componentes reutilizáveis em `src/components/ui/`
- Componentes específicos de domínio (admin, consumer, partner) em subpastas

### Estilos
- **Tailwind CSS 4**: usar `className` com utility classes
- **Framer Motion**: para animações (ex: transições de página, hover effects)
- **CSS Global**: em `src/app/globals.css` somente para estilos globais
- Variáveis CSS customizadas: `--font-inter`, `--font-display`

## Autenticação & Autorização

### Fluxo de Autenticação
1. Usuário faz login via `src/app/auth/page.tsx`
2. API route `src/app/api/auth/route.ts` valida credenciais com Supabase
3. JWT token armazenado no cookie (HttpOnly, Secure)
4. Role-based access: `consumer`, `partner`, `admin`

### Verificação de Autenticação
- **Server-side**: usar `server-auth.ts` para extrair sessão
- **Client-side**: componentes checam `useAuth()` ou contexto similar
- **SiteHeader**: componente awareness com render condicional por role

## Database & Supabase

### Estrutura
- Schema definido em `supabase/schema.sql`
- Dados seed em `supabase/seed.sql`
- Tabelas principais: users, partners, offers, consumer_profiles, partner_profiles
- RLS (Row Level Security) implementado para multi-tenant isolation

### Client Supabase
- Cliente de servidor em `src/lib/supabase/server.ts` (use em Server Components/API Routes)
- Cliente de navegador em `src/lib/supabase/client.ts` (use em Client Components)

### Variáveis de Ambiente
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Páginas Públicas vs Autenticadas

### Públicas (sem autenticação)
- `/` (home)
- `/como-funciona`
- `/faq`
- `/lgpd`
- `/privacidade`
- `/termos-de-uso`
- `/suporte`
- `/parceiros` (lista pública)

### Autenticadas (por role)
- `/auth` (login/signup)
- `/consumer` (role: consumer)
- `/partner` (role: partner)
- `/admin` (role: admin)

## Running & Deployment

### Desenvolvimento
```bash
npm run dev
# Acessa http://localhost:3000
# Usa webpack para melhor DX
```

### Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Avisos Importantes

### Next.js 16 Breaking Changes
- App Router (não Pages Router)
- Server Components por padrão
- `use client` apenas quando necessário (interatividade, hooks)
- Não usar `getServerSideProps` ou `getStaticProps` (substituir por Server Components ou Route Handlers)
- Route Handlers em `app/api/` (não `pages/api/`)

### Tipos & Null/Undefined
- Usar `undefined` para valores ausentes (não `null`)
- Ser rigoroso com tipos TypeScript (strict mode ativado)
- Converter `null` do banco para `undefined` em mapeamentos de dados

### Supabase & RLS
- Sempre considerar Row Level Security
- Dados devem ser filtrados por tenant/user_id quando apropriado
- Usar `service_role` apenas em Server Components/API Routes privadas

### Performance
- Code splitting automático por rota
- Image optimization com Next.js Image component
- Lazy loading de componentes pesados com `dynamic()`

## Commits & PR

- Mensagens em português ou inglês (be consistent)
- Descrever o "why" além do "what"
- Referência a issues/tickets quando aplicável

## Contato & Suporte

**Email do projeto**: ecardbrasil@gmail.com

---

**Última atualização**: 2026-04-29
