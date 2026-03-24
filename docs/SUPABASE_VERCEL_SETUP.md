# Supabase + Vercel Setup

Este documento prepara o projeto para sair de `localStorage` e evoluir para banco real.

## 1) Criar projeto no Supabase

1. Acesse https://supabase.com e crie um projeto.
2. Copie:
- `Project URL`
- `anon public key`
- `service_role key` (uso somente server-side)

## 2) Criar base de dados

1. No Supabase, abra `SQL Editor`.
2. Execute o arquivo `supabase/schema.sql`.
3. Valide se as tabelas foram criadas:
- `users`
- `companies`
- `offers`
- `redemptions`
- `notifications`

## 3) Variaveis de ambiente locais

1. Copie `.env.example` para `.env.local`.
2. Preencha:

```env
NEXT_PUBLIC_DATA_PROVIDER=local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Notas:
- Mantenha `NEXT_PUBLIC_DATA_PROVIDER=local` ate finalizar a migracao de funcoes.
- Troque para `supabase` quando os fluxos CRUD estiverem migrados.

## 4) Deploy na Vercel

1. Suba para GitHub.
2. Importe o repo na Vercel.
3. Em `Project Settings > Environment Variables`, configure as mesmas chaves:
- `NEXT_PUBLIC_DATA_PROVIDER`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (apenas para rotas server, nunca no client)
4. Faça deploy.

## 5) Estrutura adicionada no projeto

- `src/lib/runtime-config.ts`: chave unica para modo `local` ou `supabase`.
- `src/lib/supabase/client.ts`: cliente browser.
- `src/lib/supabase/server.ts`: cliente server com service role.
- `supabase/schema.sql`: schema inicial com indices e RLS base.

## 6) Proximo passo recomendado (migracao incremental)

1. Migrar leitura publica de ofertas/parceiros para Supabase.
2. Migrar cadastro/login para Supabase Auth.
3. Migrar fluxo de parceiro (perfil/ofertas/notificacoes).
4. Migrar fluxo admin (aprovacoes).
5. Remover `localStorage` como fonte principal.

## 7) Seed de dados demo (opcional)

Para popular a base com dados iniciais do MVP:

1. Abra `SQL Editor` no Supabase.
2. Cole o conteúdo de `supabase/seed.sql`.
3. Execute `Run`.

Credenciais demo inseridas:
- Admin: `admin@clubezn.com` / `123456`
- Parceiro: `parceiro@sarandi.com` / `123456`
- Consumidor: `cliente@clubezn.com` / `123456`
