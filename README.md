## ClubeZN MVP

MVP web mobile-first do ClubeZN (clube de vantagens para a Zona Norte de Porto Alegre/RS), com:

- Landing page pública para visitantes sem login
- Área de autenticação separada (`/auth`)
- 3 áreas internas

- Consumidor
- Empresa Parceira
- Administrador

### Funcionalidades do MVP

- Login com e-mail ou celular + senha
- Cadastro de consumidor e empresa parceira
- Publicação imediata de empresas e ofertas (sem aprovação manual)
- Listagem de ofertas ativas para consumidor
- Geração de código numérico de resgate (6 dígitos, validade 10 minutos)
- Validação do código pela empresa parceira
- Detalhamento da oferta com:
- galeria de imagens no modal
- distância aproximada em km (quando disponível)
- mapa com pin da empresa parceira (quando há endereço físico)
- Perfil da empresa parceira com opção de informar que não possui endereço físico
- Dashboard no admin com monitoramento operacional (sem moderação manual)

### Segurança e sessão

- Sessão de API baseada em token assinado (`Authorization: Bearer ...`)
- Validação de papel por rota (`admin`, `partner`, `consumer`)
- Senha com hash no fluxo Supabase (`scrypt`) com migração automática de registros legados no login
- `User` público sem campo de senha retornado ao frontend

### Identidade visual

- Cor oficial da identidade visual ClubeZN: `#C9F549`
- Uso recomendado: banners, seções de destaque e elementos de chamada visual
- Padrão visual oficial (UI, botões, cards, tom e consistência): `docs/PLATAFORMA_CLUBEZN.md` (seção 7)

### Credenciais de demonstração

- Admin: `admin@clubezn.com` / `123456`
- Parceiro: `parceiro@sarandi.com` / `123456`
- Consumidor: `cliente@clubezn.com` / `123456`

### Rodando localmente

```bash
npm run dev
```

Abra `http://localhost:3000`.
- Landing pública: `/`
- Login/cadastro: `/auth`
- Consumidor: `/consumer`
- Parceiro: `/partner`
- Admin: `/admin`

### Build de produção

```bash
npm run build
npm run start
```

### Deploy em link temporário (Vercel)

1. Suba este diretório em um repositório GitHub.
2. Importe o repositório na Vercel.
3. Configure as variáveis de ambiente (ver `.env.example`):
- `NEXT_PUBLIC_DATA_PROVIDER`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (somente server-side)
- `API_SESSION_SECRET` (segredo para assinatura dos tokens de sessão da API)
4. Deploy padrão de Next.js.

### Observação importante

Este MVP usa `localStorage` para persistência local (demo). Em produção real, o próximo passo é migrar para backend com banco (ex.: Supabase/Postgres), autenticação robusta e regras de auditoria/LGPD.

### Preparacao Supabase

- Schema inicial pronto em `supabase/schema.sql`
- Cliente Supabase browser/server pronto em `src/lib/supabase`
- Config de provider em `src/lib/runtime-config.ts`
- Guia de setup completo em `docs/SUPABASE_VERCEL_SETUP.md`

### Checklist de evolucao

Consulte o checklist em `docs/CHECKLIST_MELHORIAS.md`.
