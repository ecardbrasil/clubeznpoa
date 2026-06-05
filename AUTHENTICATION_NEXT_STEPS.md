# Próximos Passos - Autenticação com Google

## ✅ Implementação Concluída

Implementação completa de autenticação com Google usando **NextAuth.js v4**, mantendo compatibilidade com login/cadastro tradicional.

**Commit**: `feat: adicionar autenticacao com Google usando NextAuth.js v4`

## 🚀 Para Começar a Usar

### 1️⃣ Gerar Credenciais Google (5 minutos)

```bash
# Acesse Google Cloud Console
# https://console.cloud.google.com/

# 1. Crie um novo projeto ou selecione existente
# 2. Ative "Google+ API"
# 3. Vá para Credenciais > Criar > ID do cliente OAuth > Aplicação da web
# 4. Configure URIs autorizados:
#    - http://localhost:3000
#    - http://localhost:3000/api/auth/callback/google

# 5. Copie Client ID e Secret
```

### 2️⃣ Configurar Variáveis de Ambiente (2 minutos)

Crie `.env.local` na raiz:

```env
# Google OAuth (copie da etapa anterior)
GOOGLE_CLIENT_ID=sua-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-secret

# Gerar chave segura:
# openssl rand -base64 32
NEXTAUTH_SECRET=cole-aqui-a-chave-aleatoria

# Base URL
NEXTAUTH_URL=http://localhost:3000

# Supabase (já deve ter)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Email para password reset (já deve ter)
SEND_RESET_EMAIL_SECRET=...
```

### 3️⃣ Aplicar Migration no Banco (1 minuto)

**Opção A: Via Supabase CLI**
```bash
supabase migration up
```

**Opção B: Manualmente**
```
1. Abra Supabase Dashboard
2. Vá para SQL Editor
3. Cole o conteúdo de: supabase/migrations/0001_add_oauth_support.sql
4. Execute
```

A migration permite que a coluna `password` seja `NULL` para usuários que usam Google OAuth.

### 4️⃣ Testar Localmente (1 minuto)

```bash
npm run dev
# Acesse http://localhost:3000/auth
```

Você verá:
```
[Google Auth Button] [Divisor "ou"]
[Tab Login] [Tab Cadastro]
Formulário Email+Senha
```

Teste ambos:
- ✅ Clique "Entrar com Google"
- ✅ Use login tradicional (email + senha)

## 📋 Checklist de Implementação

- [x] NextAuth.js v4 configurado
- [x] Google OAuth provider
- [x] Credentials provider (email+senha)
- [x] JWT com cookies seguros
- [x] SessionProvider no layout
- [x] GoogleAuthButton componente
- [x] useAuth() hook
- [x] Server actions para signup/login
- [x] Password reset com OTP
- [x] Migration para OAuth
- [x] Documentação completa
- [ ] **Credenciais Google criadas** ← Você está aqui
- [ ] `.env.local` configurado
- [ ] Migration aplicada
- [ ] Testes locais realizados

## 🎯 Para Produção

Quando for fazer deploy:

1. **Atualizar credenciais Google**
   ```
   Google Cloud Console → Credenciais
   Adicionar seu domínio de produção em "URIs autorizados"
   ```

2. **Variáveis de produção**
   ```env
   NEXTAUTH_URL=https://seu-dominio.com
   NEXTAUTH_SECRET=nova-chave-aleatoria-segura
   GOOGLE_CLIENT_ID=seu-prod-client-id
   GOOGLE_CLIENT_SECRET=seu-prod-secret
   ```

3. **Certificado HTTPS**
   ```
   ⚠️ OBRIGATÓRIO para cookies Secure
   Usar serviço como Vercel (automático) ou Let's Encrypt
   ```

4. **Database**
   ```
   Aplicar mesma migration em produção
   ```

## 📚 Arquivos de Referência

### Documentação
- **NEXTAUTH_IMPLEMENTATION.md**: Detalhes técnicos completos
- **GOOGLE_AUTH_SETUP.md**: Passo a passo de setup Google
- **AUTHENTICATION_NEXT_STEPS.md**: Este arquivo

### Código Principal
- **src/lib/auth.ts**: Configuração NextAuth (providers, callbacks)
- **src/app/api/auth/[...nextauth]/route.ts**: Route handler
- **src/app/auth/actions.ts**: Server actions
- **src/components/google-auth-button.tsx**: Botão reutilizável
- **src/hooks/use-auth.ts**: Hook para componentes cliente

### Database
- **supabase/migrations/0001_add_oauth_support.sql**: Schema changes

## 🧪 Testando Fluxos

### Teste 1: Novo usuário com Google
1. Clique "Entrar com Google"
2. Use conta Google do test
3. Sistema cria usuário automaticamente como "consumer"
4. Redirecionado para /consumer (ofertas)

### Teste 2: Usuário existente com Google
1. Já cadastrado via email+senha
2. Clique "Entrar com Google" com MESMO email
3. Sistema reconhece o email
4. Faz login (sem criar novo usuário)

### Teste 3: Login tradicional
1. Clique aba "Entrar"
2. Digite email + senha
3. Valida credenciais
4. Redirecionado para /consumer

### Teste 4: Cadastro tradicional
1. Clique aba "Criar conta"
2. Escolha Consumer ou Partner
3. Preencha dados
4. Crie senha (6+ caracteres, letras e números)
5. Cria conta e redirecionado

### Teste 5: Reset de senha
1. Clique "Esqueci minha senha"
2. Digite email/celular
3. OTP enviado por email
4. Digite código de 6 dígitos
5. Crie nova senha
6. Faça login com nova senha

## ⚠️ Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "NEXTAUTH_SECRET not configured" | Variável não definida | Adicione em `.env.local` |
| "Invalid redirect_uri" | Google não reconhece URL | Verifique Google Console + NEXTAUTH_URL |
| "User already exists" | Email duplicado | Usar login ou reset senha |
| "Cannot POST /api/auth/..." | NextAuth não iniciou | Restart `npm run dev` |
| "Cookie error" | HTTPS não configurado (prod) | Setup SSL/TLS |

## 📞 Suporte Rápido

### Documentação em Código
```tsx
// Ver exemplo de uso em componente client
src/components/google-auth-button.tsx

// Ver exemplo de uso em server component
src/app/partner/page.tsx (já usa getServerSession)

// Ver exemplo de hook
src/hooks/use-auth.ts
```

### Testes Úteis
```bash
# Checar se compilação está OK
npm run build

# Resetar node_modules
rm -rf node_modules && npm install

# Limpar cache Next.js
rm -rf .next && npm run dev
```

## 🎓 Aprendizado

Implementação usa:
- **Next.js 16**: App Router, Server Components, Server Actions
- **NextAuth.js v4**: OAuth2, JWT, Credentials
- **TypeScript**: Type-safe auth
- **Supabase**: PostgreSQL para usuários
- **Crypto**: Hashing de senhas com scrypt

---

**Status**: ✅ Pronto para usar
**Próximo**: Criar credenciais Google e configurar `.env.local`
