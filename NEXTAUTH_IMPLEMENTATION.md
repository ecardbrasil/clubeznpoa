# Implementação de Autenticação com Google - NextAuth.js v4

## ✅ O que foi implementado

### 1. **Configuração NextAuth.js v4**
- Suporte completo para autenticação com Google OAuth 2.0
- Mantém sistema de login/cadastro tradicional (email+senha)
- Ambos os métodos coexistem na mesma página de autenticação

### 2. **Fluxos de Autenticação**

#### Login/Cadastro com Google
1. Usuário clica em "Entrar/Criar conta com Google"
2. NextAuth redireciona para Google
3. Google redireciona de volta com credenciais
4. Sistema verifica se email já existe
   - Se existe: faz login
   - Se não existe: cria conta como "consumer" automaticamente
5. JWT é armazenado em cookie seguro HttpOnly
6. Usuário redirecionado para `/consumer` (ofertas)

#### Login Tradicional (Email/Senha)
1. Usuário entra com email ou celular + senha
2. Credenciais validadas contra banco
3. JWT criado e armazenado
4. Redirecionado para `/consumer`

#### Cadastro Tradicional
1. Usuário escolhe tipo de conta (Consumer ou Partner)
2. Preenche dados de registro
3. Senha validada (6+ caracteres, letras e números)
4. Se Partner: dados da empresa requeridos
5. Conta criada no banco
6. Automático: pode fazer login na sequência

#### Recuperação de Senha
1. Usuário solicita reset via email/celular
2. OTP de 6 dígitos enviado por email
3. Usuário confirma OTP e define nova senha
4. Senha atualizada no banco

### 3. **Arquivos Criados**

```
src/
├── lib/
│   └── auth.ts                    # Configuração NextAuth.js
├── app/
│   ├── api/auth/[...nextauth]/
│   │   └── route.ts               # Route handler NextAuth
│   └── auth/
│       └── actions.ts             # Server actions (signup, password reset)
├── components/
│   ├── google-auth-button.tsx     # Botão de auth com Google
│   └── providers/
│       └── session-provider.tsx   # Provider de sessão
└── hooks/
    └── use-auth.ts                # Hook para usar auth em components

supabase/
└── migrations/
    └── 0001_add_oauth_support.sql # Migration: permite password NULL
```

### 4. **Modificações em Arquivos Existentes**

- `package.json`: Adicionado `next-auth@^4.24.10`
- `src/app/layout.tsx`: Adicionado `AuthSessionProvider`
- `src/app/auth/page.tsx`: Adicionado botão Google, integrado NextAuth
- `.env.example`: Adicionadas variáveis Google OAuth

## 🚀 Próximos Passos - Setup

### 1. Criar Credenciais Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie projeto ou selecione existente
3. Ative "Google+ API"
4. Vá para "Credenciais" → "Criar credencial" → "ID do cliente OAuth"
5. Selecione "Aplicação da web"
6. Em "URIs autorizados de redirecionamento", adicione:
   ```
   http://localhost:3000
   http://localhost:3000/api/auth/callback/google
   https://seu-dominio.com/api/auth/callback/google  (produção)
   ```
7. Copie **Client ID** e **Client Secret**

### 2. Configurar Variáveis de Ambiente

Crie `.env.local` na raiz do projeto:

```env
# Google OAuth
GOOGLE_CLIENT_ID=sua-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
NEXTAUTH_SECRET=gere-com: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Supabase (já deve existir)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Email (reset de senha)
SEND_RESET_EMAIL_SECRET=seu-secret
```

Gerar `NEXTAUTH_SECRET` segura:
```bash
openssl rand -base64 32
```

### 3. Aplicar Migration no Banco

Execute em Supabase SQL Editor ou via CLI:

```bash
# Via Supabase CLI
supabase migration up

# Ou copie o conteúdo de:
# supabase/migrations/0001_add_oauth_support.sql
```

A migration permite que a coluna `password` seja NULL para usuários Google.

### 4. Iniciar Servidor

```bash
npm run dev
# http://localhost:3000/auth
```

Teste ambos os fluxos:
- Clique em "Entrar com Google"
- Use login tradicional com email/senha

## 📱 Usando Auth em Componentes

### Client Component - Hook useAuth

```tsx
"use client";

import { useAuth } from "@/hooks/use-auth";

export function MyComponent() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();

  if (isLoading) return <p>Carregando...</p>;
  if (!isAuthenticated) return <p>Faça login</p>;

  return (
    <div>
      <p>Bem-vindo, {user?.name}</p>
      <p>Email: {user?.email}</p>
      <p>Role: {user?.role}</p>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

### Server Component - Função auth()

```tsx
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  const user = session.user as any;
  return <div>Bem-vindo, {user.name}</div>;
}
```

## 🔐 Segurança

### ✅ Implementado

- **JWT com segurança**: Cookie HttpOnly, Secure, SameSite=Lax
- **TTL de 7 dias** para sessão
- **Password hashing**: scrypt com salt aleatório
- **Timing-safe comparison** para senhas
- **RLS no banco**: Dados filtrados por user_id
- **Email verification**: Obrigatório para reset de senha
- **OTP com timeout**: 15 minutos de validade

### ⚠️ Considerações em Produção

1. **NEXTAUTH_URL**: Defina com domínio correto
2. **NEXTAUTH_SECRET**: Use chave aleatória segura
3. **Certificado HTTPS**: Obrigatório (cookies Secure)
4. **Google OAuth**: Adicione domínio de produção
5. **Rate limiting**: Considere limitar tentativas de login

## 🐛 Troubleshooting

### "NEXTAUTH_SECRET não configurado"
```
Error: NEXTAUTH_SECRET is not configured
```
→ Defina em `.env.local`:
```env
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

### "Invalid redirect URI"
```
The redirect URI is not whitelisted in the OAuth app
```
→ Verifique em Google Cloud:
- `NEXTAUTH_URL` env var correto
- URIs adicionadas no Google Console
- Protocol (http vs https) correto

### "User already exists"
→ Normal se tentou cadastro com email já registrado
→ Use login tradicional ou reset de senha

### Usuário não consegue fazer login após Google
→ Esperado! Usuários Google não têm senha local
→ Use sempre Google para login, ou
→ Clique "Esqueci senha" para definir senha local

## 📊 Banco de Dados - Mudanças

### Coluna `password`
```sql
-- Antes: NOT NULL
-- Depois: NULL (permite usuários OAuth)
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

### Novas colunas (opcionais)
```sql
-- Para rastrear conexão OAuth
oauth_provider TEXT
oauth_id TEXT
```

Atualmente, o sistema identifica usuários Google apenas pelo email. Se quiser rastrear explicitamente, atualize a migration.

## 🔄 Fluxo Completo - Diagrama

```
┌─────────────────┐
│  Página /auth   │
└────────┬────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
┌─────────┐  ┌──────────────┐
│ Google  │  │ Email+Senha  │
└────┬────┘  └──────┬───────┘
     │              │
     ▼              ▼
┌──────────────────────────────────┐
│ NextAuth.js JWT Callback         │
│ - Valida credenciais             │
│ - Cria/atualiza sessão           │
│ - Retorna JWT                    │
└───────────┬──────────────────────┘
            │
     ┌──────▼───────┐
     │ Cookie JWT   │
     │ HttpOnly     │
     └──────┬───────┘
            │
     ┌──────▼────────────┐
     │ router.push()     │
     │ → /consumer       │
     └───────────────────┘
```

## 📚 Referências

- [NextAuth.js v4 Docs](https://next-auth.js.org/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Next.js 16 API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## ✨ Próximas Melhorias (Opcionais)

1. **Social Linking**: Permitir usuário conectar/desconectar Google
2. **TOTP 2FA**: Autenticação dois-fatores
3. **Email Verification**: Verificação de email no cadastro
4. **Account Lockout**: Bloqueio após N tentativas falhas
5. **Device Fingerprinting**: Rastrear dispositivos suspeitos
6. **Audit Log**: Registrar todas as ações de autenticação
