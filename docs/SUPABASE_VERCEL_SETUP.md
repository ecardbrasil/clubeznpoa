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
API_SESSION_SECRET=...
```

Notas:
- `API_SESSION_SECRET` e usado para assinar tokens de sessao da API.
- Se `API_SESSION_SECRET` nao for definido, o app usa `SUPABASE_SERVICE_ROLE_KEY` como fallback (recomendado definir segredo dedicado).
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
- `API_SESSION_SECRET`
4. Faça deploy.

## 5) Estrutura adicionada no projeto

- `src/lib/runtime-config.ts`: chave unica para modo `local` ou `supabase`.
- `src/lib/supabase/client.ts`: cliente browser.
- `src/lib/supabase/server.ts`: cliente server com service role.
- `src/lib/server-auth.ts`: assinatura e validacao de token de sessao da API.
- `supabase/schema.sql`: schema inicial com indices e RLS base.

## 6) Proximo passo recomendado (migracao incremental)

1. Consolidar leitura/escrita em Supabase para todos os fluxos principais.
2. Migrar cadastro/login para Supabase Auth.
3. Manter painel admin como monitoramento operacional (sem aprovacoes manuais).
4. Remover `localStorage` como fonte principal para producao.

## 7) Seed de dados demo (opcional)

Para popular a base com dados iniciais do MVP:

1. Abra `SQL Editor` no Supabase.
2. Cole o conteúdo de `supabase/seed.sql`.
3. Execute `Run`.

Credenciais demo inseridas:
- Admin: `admin@clubezn.com` / `123456`
- Parceiro: `parceiro@sarandi.com` / `123456`
- Consumidor: `cliente@clubezn.com` / `123456`
