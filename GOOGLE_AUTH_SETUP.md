# Google Authentication Setup

Este guia explica como configurar a autenticação com Google usando NextAuth.js v5.

## 1. Instalar dependências

```bash
npm install
```

## 2. Criar Credenciais Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API "Google+ API"
4. Vá para "Credenciais" no menu lateral
5. Clique em "Criar credenciais" > "ID do cliente OAuth"
6. Selecione "Aplicativo da web"
7. Em "URIs autorizados para redirecionamento JavaScript", adicione:
   - `http://localhost:3000`
   - `http://localhost:3000/api/auth/callback/google`
   - (em produção: `https://seu-dominio.com/api/auth/callback/google`)
8. Copie o **Client ID** e **Client Secret**

## 3. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto (copie `.env.example` como base):

```env
# Google OAuth
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
NEXTAUTH_SECRET=gere-uma-chave-segura-com: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

Para gerar uma `NEXTAUTH_SECRET` segura:

```bash
openssl rand -base64 32
```

## 4. Aplicar migrations no banco de dados

Execute a migration para adicionar suporte a OAuth:

```bash
# Via Supabase CLI (recomendado)
supabase migration up

# Ou manualmente no Supabase SQL Editor
# Copie e execute o conteúdo de supabase/migrations/0001_add_oauth_support.sql
```

## 5. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000/auth` e teste o botão "Entrar com Google".

## Como funciona?

### Login com Google

1. Usuário clica em "Entrar com Google"
2. NextAuth redireciona para o Google
3. Google redireciona de volta com token
4. NextAuth verifica se o usuário já existe no banco
5. Se existe: faz login
6. Se não existe: cria novo usuário como "consumer"
7. Usuário é redirecionado para `/consumer` (ofertas)

### Sessão

- Sessão usa JWT (armazenado em cookie seguro)
- TTL: 7 dias
- Usuário pode fazer logout via `useAuth().signOut()`

## Usando Auth em Componentes

### Client Component

```tsx
"use client";

import { useAuth } from "@/hooks/use-auth";

export function MyComponent() {
  const { user, isAuthenticated, signOut } = useAuth();

  if (!isAuthenticated) return <p>Faça login</p>;

  return (
    <div>
      <p>Bem-vindo, {user?.name}</p>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

### Server Component

```tsx
import { auth } from "@/lib/auth";

export default async function MyPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth");
  }

  const user = session.user as any;
  return <div>Bem-vindo, {user.name}</div>;
}
```

## Configuração em Produção

1. Atualize `NEXTAUTH_URL` com seu domínio
2. Gere uma nova `NEXTAUTH_SECRET` segura
3. Adicione seu domínio nas credenciais do Google
4. Deploy normalmente

## Troubleshooting

### "NEXTAUTH_SECRET não está configurado"
→ Defina `NEXTAUTH_SECRET` em `.env.local`

### "Erro de redirecionamento inválido"
→ Verifique se `NEXTAUTH_URL` e URLs no Google Console estão corretos

### "Falha ao criar usuário Google"
→ Verifique se a migration foi aplicada (password pode ser NULL)

### Usuário não consegue fazer login tradicional após criar com Google
→ Normal! Usuários Google não têm senha. Use somente Google ou reset senha.
