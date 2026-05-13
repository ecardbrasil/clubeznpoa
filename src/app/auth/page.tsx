"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ChevronDown, Eye, EyeOff, Loader2, UserRound, X, Search } from "lucide-react";
import { PublicPageHeader } from "@/components/public-page-header";
import { useToast } from "@/components/ui/toast";
import { DEFAULT_CATEGORIES, serializeCategories } from "@/lib/categories";
import {
  initStorage,
  requestPasswordResetWithProvider,
  confirmPasswordResetWithProvider,
  routeByRole,
  signInWithProvider,
  signUpWithProvider,
} from "@/lib/storage";

type Mode = "login" | "register";
type RegisterRole = "consumer" | "partner";

const northZoneNeighborhoods = [
  "Sarandi",
  "Santa Rosa de Lima",
  "Passo das Pedras",
  "Rubem Berta",
  "Jardim Leopoldina",
  "Parque Santa Fe",
  "Jardim Itu",
  "Costa e Silva",
  "Jardim Lindóia",
  "Cristo Redentor",
  "Vila Ipiranga",
  "Passo da Areia",
  "Outro",
];

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const extractPhoneDigits = (value: string) => value.replace(/\D/g, "").slice(0, 11);

const formatPhoneInput = (value: string) => {
  const digits = extractPhoneDigits(value);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());
const isValidPhone = (digits: string) => digits.length >= 9 && digits.length <= 11;
const hasLetters = (value: string) => /[A-Za-z]/.test(value);
const hasNumbers = (value: string) => /\d/.test(value);
const hasMinLength = (value: string) => value.length >= 6;
const isReasonablePassword = (value: string) => hasMinLength(value) && hasLetters(value) && hasNumbers(value);

function CategoryMultiSelect({
  value,
  search,
  onSearchChange,
  onToggle,
  id,
}: {
  value: string[];
  search: string;
  onSearchChange: (v: string) => void;
  onToggle: (category: string) => void;
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = DEFAULT_CATEGORIES.filter((cat) =>
    !value.includes(cat) &&
    normalizeText(cat).includes(normalizeText(search))
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  return (
    <div ref={ref} className="grid gap-2" id={id}>
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-[var(--line)] bg-white p-2.5 min-h-[44px]">
        {value.length === 0 ? (
          <span className="text-sm text-[var(--muted)] flex items-center">Selecione categorias</span>
        ) : (
          value.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onToggle(cat)}
              className="inline-flex items-center gap-1 rounded-full bg-[#c9f549] px-2.5 py-1 text-sm font-medium text-[#0f1a13] hover:bg-[#b3df1c]"
            >
              {cat}
              <X size={14} />
            </button>
          ))
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="ml-auto flex items-center justify-center text-[var(--muted)] hover:text-[#0f1a13]"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="relative z-50 rounded-xl border border-[var(--line)] bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-[var(--line)] px-3 py-2">
            <Search size={14} className="shrink-0 text-[var(--muted)]" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar categoria..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
            />
            {search && (
              <button type="button" onClick={() => onSearchChange("")} className="text-[var(--muted)]">
                <X size={12} />
              </button>
            )}
          </div>
          <ul role="listbox" className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-[var(--muted)]">Nenhuma categoria encontrada</li>
            )}
            {filtered.map((cat) => (
              <li
                key={cat}
                role="option"
                aria-selected={value.includes(cat)}
                onClick={() => onToggle(cat)}
                className="cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-[#f8fbf4]"
              >
                {cat}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function NeighborhoodDropdown({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = northZoneNeighborhoods.filter((n) =>
    normalizeText(n).includes(normalizeText(search))
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  return (
    <div ref={ref} className="relative" id={id}>
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); }}
        className="flex w-full items-center justify-between rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#c9f549]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{value}</span>
        <ChevronDown size={16} className={`text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--line)] bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-[var(--line)] px-3 py-2">
            <Search size={14} className="shrink-0 text-[var(--muted)]" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar bairro..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-[var(--muted)]">
                <X size={12} />
              </button>
            )}
          </div>
          <ul role="listbox" className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-[var(--muted)]">Nenhum bairro encontrado</li>
            )}
            {filtered.map((n) => (
              <li
                key={n}
                role="option"
                aria-selected={value === n}
                onClick={() => { onChange(n); setOpen(false); setSearch(""); }}
                className={`cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-[#f8fbf4] ${
                  value === n ? "font-semibold text-[var(--brand)]" : ""
                }`}
              >
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LegalModal({ type, onClose }: { type: "termos" | "privacidade"; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={type === "termos" ? "Termos de uso" : "Política de privacidade"}
    >
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <h2 className="m-0 text-base font-bold text-[#0f1a13]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
            {type === "termos" ? "Termos de uso" : "Política de privacidade"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:bg-[#f8fbf4]"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          {type === "termos" ? (
            <div className="space-y-4 text-sm text-[var(--muted)] leading-relaxed">
              <section>
                <p className="font-semibold text-[#0f1a13] mb-1">1. Aceitação e Natureza do Serviço</p>
                <p>O uso da plataforma implica concordância total com estas regras. O ClubeZN atua como <strong>intermediador de anúncios</strong>, facilitando o encontro entre moradores da Zona Norte e empresas locais. Não realizamos moderação prévia das ofertas; portanto, a veracidade e a entrega dos produtos/serviços são de responsabilidade exclusiva do lojista.</p>
              </section>
              <section>
                <p className="font-semibold text-[#0f1a13] mb-1">2. Idade Mínima e Cadastro</p>
                <p>Para utilizar o ClubeZN como Consumidor, você deve ter no mínimo <strong>16 anos</strong>. Usuários entre 16 e 18 anos declaram estar assistidos por seus responsáveis legais.</p>
              </section>
              <section>
                <p className="font-semibold text-[#0f1a13] mb-1">3. Dinâmica das Ofertas e Resgate</p>
                <p>As ofertas são criadas e gerenciadas pelos parceiros. O ClubeZN não garante disponibilidade, qualidade ou entrega. Em caso de problemas, entre em contato diretamente com o estabelecimento.</p>
              </section>
              <section>
                <p className="font-semibold text-[#0f1a13] mb-1">4. Responsabilidades do Usuário</p>
                <p>Você é responsável por manter suas credenciais de acesso em segurança e por todas as ações realizadas com sua conta.</p>
              </section>
              <section>
                <p className="font-semibold text-[#0f1a13] mb-1">5. Alterações nos Termos</p>
                <p>O ClubeZN pode atualizar estes termos a qualquer momento. O uso continuado da plataforma após alterações implica aceitação dos novos termos.</p>
              </section>
            </div>
          ) : (
            <div className="space-y-4 text-sm text-[var(--muted)] leading-relaxed">
              <p>Coletamos apenas dados necessários para autenticação, uso da plataforma e atendimento.</p>
              <p>Não comercializamos dados pessoais com terceiros.</p>
              <p>Você pode solicitar atualização ou exclusão de dados pelos canais oficiais de suporte.</p>
              <p>Os dados coletados incluem: nome, e-mail, celular e bairro. Esses dados são utilizados exclusivamente para personalizar sua experiência na plataforma.</p>
              <p>Em conformidade com a LGPD (Lei 13.709/2018), você tem direito de acesso, correção e exclusão dos seus dados pessoais.</p>
            </div>
          )}
        </div>
        <div className="border-t border-[var(--line)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary w-full"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [mode, setMode] = useState<Mode>(() => {
    const tab = searchParams.get("tab");
    return tab === "register" ? "register" : "login";
  });
  const [registerRole, setRegisterRole] = useState<RegisterRole>("consumer");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consumerNeighborhood, setConsumerNeighborhood] = useState("Sarandi");

  const [companyName, setCompanyName] = useState("");
  const [companyCategory, setCompanyCategory] = useState<string[]>([]);
  const [companyCategorySearch, setCompanyCategorySearch] = useState("");
  const [companyNeighborhood, setCompanyNeighborhood] = useState("Sarandi");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showRecoverPassword, setShowRecoverPassword] = useState(false);
  const [showRecoverConfirmPassword, setShowRecoverConfirmPassword] = useState(false);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [recoverStep, setRecoverStep] = useState<"request" | "confirm">("request");
  const [recoverIdentifier, setRecoverIdentifier] = useState("");
  const [recoverOtp, setRecoverOtp] = useState("");
  const [recoverNewPassword, setRecoverNewPassword] = useState("");
  const [recoverConfirmPassword, setRecoverConfirmPassword] = useState("");

  const [legalModal, setLegalModal] = useState<"termos" | "privacidade" | null>(null);

  const phoneDigits = extractPhoneDigits(phone);
  const emailInvalid = email.trim().length > 0 && !isValidEmail(email);
  const phoneInvalid = phoneDigits.length > 0 && !isValidPhone(phoneDigits);
  const passwordInvalid = mode === "register" && password.length > 0 && !isReasonablePassword(password);
  const passwordValid = mode === "register" && isReasonablePassword(password);

  const identifierTrimmed = identifier.trim();
  const identifierDigits = extractPhoneDigits(identifierTrimmed);
  const identifierLooksLikeEmail = identifierTrimmed.includes("@");
  const identifierInvalid =
    identifierTrimmed.length > 0 &&
    !(
      (identifierLooksLikeEmail && isValidEmail(identifierTrimmed)) ||
      (!identifierLooksLikeEmail && isValidPhone(identifierDigits))
    );

  const recoverIdentifierTrimmed = recoverIdentifier.trim();
  const recoverIdentifierDigits = extractPhoneDigits(recoverIdentifierTrimmed);
  const recoverIdentifierLooksLikeEmail = recoverIdentifierTrimmed.includes("@");
  const recoverIdentifierInvalid =
    recoverIdentifierTrimmed.length > 0 &&
    !(
      (recoverIdentifierLooksLikeEmail && isValidEmail(recoverIdentifierTrimmed)) ||
      (!recoverIdentifierLooksLikeEmail && isValidPhone(recoverIdentifierDigits))
    );

  const recoverPasswordMismatch =
    recoverConfirmPassword.length > 0 && recoverNewPassword.length > 0 && recoverNewPassword !== recoverConfirmPassword;

  useEffect(() => {
    initStorage();
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "register") setMode("register");
    else if (tab === "login") setMode("login");
  }, [searchParams]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setInfo("");

    if (!identifierTrimmed) {
      const message = "Informe seu e-mail ou celular.";
      setError(message);
      showToast(message, "error");
      return;
    }

    if (identifierInvalid) {
      const message = "Use um e-mail válido ou celular com DDD para entrar.";
      setError(message);
      showToast(message, "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedIdentifier = identifierLooksLikeEmail ? identifierTrimmed.toLowerCase() : identifierDigits;
      const result = await signInWithProvider(normalizedIdentifier, password);
      if (!result.user) {
        const message = result.error || "Não foi possível entrar.";
        setError(message);
        showToast(message, "error");
        return;
      }

      showToast("Login realizado com sucesso.", "success");
      router.push(routeByRole(result.user.role));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestPasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError("");
    setInfo("");

    if (!recoverIdentifierTrimmed) {
      const message = "Informe seu e-mail ou celular.";
      setError(message);
      showToast(message, "error");
      return;
    }

    if (recoverIdentifierInvalid) {
      const message = "Informe um e-mail válido ou celular com DDD.";
      setError(message);
      showToast(message, "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedIdentifier = recoverIdentifierLooksLikeEmail
        ? recoverIdentifierTrimmed.toLowerCase()
        : recoverIdentifierDigits;
      const response = await requestPasswordResetWithProvider(normalizedIdentifier);
      if (response.error) {
        setError(response.error);
        showToast(response.error, "error");
        return;
      }

      setRecoverStep("confirm");
      const message = "Código enviado. Verifique seu e-mail.";
      setInfo(message);
      showToast(message, "success");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError("");
    setInfo("");

    if (!recoverOtp.trim()) {
      const message = "Informe o código recebido.";
      setError(message);
      showToast(message, "error");
      return;
    }

    if (!isReasonablePassword(recoverNewPassword)) {
      const message = "A nova senha precisa ter no mínimo 6 caracteres, com letras e números.";
      setError(message);
      showToast(message, "error");
      return;
    }

    if (recoverNewPassword !== recoverConfirmPassword) {
      const message = "A confirmação da senha não confere.";
      setError(message);
      showToast(message, "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedIdentifier = recoverIdentifierLooksLikeEmail
        ? recoverIdentifierTrimmed.toLowerCase()
        : recoverIdentifierDigits;
      const response = await confirmPasswordResetWithProvider(normalizedIdentifier, recoverOtp.trim(), recoverNewPassword);
      if (response.error) {
        setError(response.error);
        showToast(response.error, "error");
        return;
      }

      setRecoverOpen(false);
      setRecoverStep("request");
      setRecoverIdentifier("");
      setRecoverOtp("");
      setRecoverNewPassword("");
      setRecoverConfirmPassword("");
      setPassword("");
      setIdentifier(normalizedIdentifier);
      const message = "Senha redefinida com sucesso. Faça login com a nova senha.";
      setInfo(message);
      showToast(message, "success");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setInfo("");

    if (!email.trim()) {
      const message = "Informe seu e-mail.";
      setError(message);
      showToast(message, "error");
      return;
    }
    if (!phoneDigits) {
      const message = "Informe seu celular.";
      setError(message);
      showToast(message, "error");
      return;
    }
    if (emailInvalid) {
      const message = "Informe um e-mail válido.";
      setError(message);
      showToast(message, "error");
      return;
    }
    if (phoneInvalid) {
      const message = "Informe um celular válido com DDD.";
      setError(message);
      showToast(message, "error");
      return;
    }
    if (!isReasonablePassword(password)) {
      const message = "Crie uma senha com pelo menos 6 caracteres, incluindo letras e números.";
      setError(message);
      showToast(message, "error");
      return;
    }

    if (registerRole === "partner" && companyCategory.length === 0) {
      const message = "Selecione pelo menos uma categoria para a empresa.";
      setError(message);
      showToast(message, "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await signUpWithProvider({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phoneDigits || undefined,
        neighborhood: registerRole === "consumer" ? consumerNeighborhood : undefined,
        password,
        role: registerRole,
        companyName: companyName.trim(),
        companyCategory: serializeCategories(companyCategory),
        companyNeighborhood,
      });

      if (response.error || !response.user) {
        setError(response.error || "Não foi possível criar a conta.");
        showToast(response.error || "Não foi possível criar a conta.", "error");
        return;
      }

      const successMessage =
        response.user.role === "partner"
          ? "Conta criada. Sua empresa será analisada antes da publicação das ofertas."
          : "Conta criada com sucesso.";
      showToast(successMessage, "success");
      router.push(routeByRole(response.user.role));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="clubezn-shell grid gap-4">
      <PublicPageHeader smallLogo />

      {legalModal && (
        <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
      )}

      <div className="mx-auto w-full max-w-md">
        <section className="card grid gap-4">
          <div className="grid gap-1 text-center">
            <h1 className="m-0 text-2xl" style={{ fontFamily: "var(--font-poppins), sans-serif", fontWeight: 800, color: "#0f1a13" }}>
              {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
            </h1>
            <p className="m-0 text-sm text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
              {mode === "login"
                ? "Acesse ofertas exclusivas da Zona Norte."
                : "Economize na Zona Norte com ofertas exclusivas."}
            </p>
          </div>

          <div role="tablist" aria-label="Escolha entre login e cadastro" className="grid grid-cols-2 rounded-xl border border-[var(--line)] bg-[#f8fbf4] p-1 gap-1">
            <button
              id="tab-login"
              role="tab"
              type="button"
              aria-selected={mode === "login"}
              aria-controls="panel-login"
              className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
                mode === "login"
                  ? "bg-white shadow-sm text-[#0f1a13]"
                  : "text-[var(--muted)] hover:text-[#0f1a13]"
              }`}
              style={{ fontFamily: "var(--font-poppins), sans-serif" }}
              onClick={() => {
                setMode("login");
                setError("");
                setInfo("");
              }}
            >
              Entrar
            </button>
            <button
              id="tab-register"
              role="tab"
              type="button"
              aria-selected={mode === "register"}
              aria-controls="panel-register"
              className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
                mode === "register"
                  ? "bg-white shadow-sm text-[#0f1a13]"
                  : "text-[var(--muted)] hover:text-[#0f1a13]"
              }`}
              style={{ fontFamily: "var(--font-poppins), sans-serif" }}
              onClick={() => {
                setMode("register");
                setError("");
                setInfo("");
              }}
            >
              Criar conta
            </button>
          </div>

          {mode === "login" && (
            <div id="panel-login" role="tabpanel" aria-labelledby="tab-login" className="grid gap-3">
              <form onSubmit={handleLogin} className="grid gap-3" noValidate>
                <label className="field" htmlFor="login-identifier">
                  <span>E-mail ou celular</span>
                  <input
                    id="login-identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="cliente@clubezn.com ou (51) 99999-0000"
                    required
                    autoComplete="username"
                    aria-invalid={identifierInvalid}
                    aria-describedby={identifierInvalid ? "login-identifier-error" : undefined}
                  />
                </label>
                {identifierInvalid && (
                  <p id="login-identifier-error" className="m-0 -mt-2 text-xs font-bold" role="alert" style={{ color: "var(--warn)" }}>
                    Digite um e-mail válido ou celular com DDD.
                  </p>
                )}

                <label className="field" htmlFor="login-password">
                  <span>Senha</span>
                  <div className="relative">
                    <input
                      id="login-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showLoginPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      className="pr-11"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-lg border border-[var(--line)] bg-white p-1.5 text-[var(--muted)]"
                      aria-label={showLoginPassword ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setShowLoginPassword((current) => !current)}
                    >
                      {showLoginPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>

                <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Carregando...
                    </span>
                  ) : (
                    "Acessar"
                  )}
                </button>
              </form>

              <button
                type="button"
                className="text-center text-sm font-bold text-[var(--brand)] underline underline-offset-2"
                style={{ fontFamily: "var(--font-dm), sans-serif" }}
                onClick={() => {
                  setRecoverOpen((current) => {
                    if (current) {
                      setRecoverStep("request");
                      setRecoverIdentifier("");
                      setRecoverOtp("");
                      setRecoverNewPassword("");
                      setRecoverConfirmPassword("");
                    }
                    return !current;
                  });
                  setError("");
                  setInfo("");
                }}
              >
                {recoverOpen ? "Fechar recuperação de senha" : "Esqueci minha senha"}
              </button>

              {recoverOpen && recoverStep === "request" && (
                <form onSubmit={handleRequestPasswordReset} className="grid gap-3 rounded-xl border border-[var(--line)] bg-[#f8fbf4] p-3" noValidate>
                  <p className="m-0 text-sm font-bold text-[var(--brand)]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Recuperar senha</p>
                  <p className="m-0 text-xs text-[var(--muted)]">Informe seu e-mail ou celular cadastrado e enviaremos um código de verificação.</p>

                  <label className="field" htmlFor="recover-identifier">
                    <span>E-mail ou celular</span>
                    <input
                      id="recover-identifier"
                      value={recoverIdentifier}
                      onChange={(e) => setRecoverIdentifier(e.target.value)}
                      placeholder="cliente@clubezn.com ou (51) 99999-0000"
                      aria-invalid={recoverIdentifierInvalid}
                      aria-describedby={recoverIdentifierInvalid ? "recover-identifier-error" : undefined}
                    />
                  </label>
                  {recoverIdentifierInvalid && (
                    <p id="recover-identifier-error" className="m-0 -mt-2 text-xs font-bold" style={{ color: "var(--warn)" }} role="alert">
                      Digite um e-mail válido ou celular com DDD.
                    </p>
                  )}

                  <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Enviando código...
                      </span>
                    ) : (
                      "Enviar código"
                    )}
                  </button>
                </form>
              )}

              {recoverOpen && recoverStep === "confirm" && (
                <form onSubmit={handleConfirmPasswordReset} className="grid gap-3 rounded-xl border border-[var(--line)] bg-[#f8fbf4] p-3" noValidate>
                  <p className="m-0 text-sm font-bold text-[var(--brand)]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Redefinir senha</p>
                  <p className="m-0 text-xs text-[var(--muted)]">
                    Digite o código de 6 dígitos enviado para <strong>{recoverIdentifier}</strong>.
                  </p>

                  <label className="field" htmlFor="recover-otp">
                    <span>Código de verificação</span>
                    <input
                      id="recover-otp"
                      value={recoverOtp}
                      onChange={(e) => setRecoverOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="one-time-code"
                    />
                  </label>

                  <label className="field" htmlFor="recover-new-password">
                    <span>Nova senha</span>
                    <div className="relative">
                      <input
                        id="recover-new-password"
                        value={recoverNewPassword}
                        onChange={(e) => setRecoverNewPassword(e.target.value)}
                        type={showRecoverPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="pr-11"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-lg border border-[var(--line)] bg-white p-1.5 text-[var(--muted)]"
                        aria-label={showRecoverPassword ? "Ocultar senha" : "Mostrar senha"}
                        onClick={() => setShowRecoverPassword((current) => !current)}
                      >
                        {showRecoverPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </label>

                  <label className="field" htmlFor="recover-confirm-password">
                    <span>Confirmar nova senha</span>
                    <div className="relative">
                      <input
                        id="recover-confirm-password"
                        value={recoverConfirmPassword}
                        onChange={(e) => setRecoverConfirmPassword(e.target.value)}
                        type={showRecoverConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        aria-invalid={recoverPasswordMismatch}
                        aria-describedby={recoverPasswordMismatch ? "recover-confirm-error" : undefined}
                        className="pr-11"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-lg border border-[var(--line)] bg-white p-1.5 text-[var(--muted)]"
                        aria-label={showRecoverConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                        onClick={() => setShowRecoverConfirmPassword((current) => !current)}
                      >
                        {showRecoverConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </label>

                  {recoverPasswordMismatch && (
                    <p id="recover-confirm-error" className="m-0 -mt-2 text-xs font-bold" style={{ color: "var(--warn)" }} role="alert">
                      A confirmação da senha não confere.
                    </p>
                  )}

                  <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Carregando...
                      </span>
                    ) : (
                      "Redefinir senha"
                    )}
                  </button>

                  <button
                    type="button"
                    className="text-center text-xs text-[var(--muted)] underline underline-offset-2"
                    onClick={() => {
                      setRecoverStep("request");
                      setRecoverOtp("");
                      setRecoverNewPassword("");
                      setRecoverConfirmPassword("");
                      setError("");
                      setInfo("");
                    }}
                  >
                    Usar outro e-mail ou celular
                  </button>
                </form>
              )}
            </div>
          )}

          {mode === "register" && (
            <div id="panel-register" role="tabpanel" aria-labelledby="tab-register" className="grid gap-3">
              <form onSubmit={handleRegister} className="grid gap-3" noValidate>
                <div className="grid gap-2" role="radiogroup" aria-label="Tipo de conta">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Tipo de conta</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={registerRole === "consumer"}
                      onClick={() => setRegisterRole("consumer")}
                      className={`grid gap-1 rounded-xl border-2 px-3 py-3 text-left transition-all ${
                        registerRole === "consumer"
                          ? "border-[#c9f549] bg-[#c9f549] shadow-sm"
                          : "border-[var(--line)] bg-white hover:border-[#c9f549]/50"
                      }`}
                    >
                      <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${registerRole === "consumer" ? "text-[#0f1a13]" : "text-[var(--brand)]"}`}>
                        <UserRound size={15} />
                        Consumidor
                      </span>
                      <span className={`text-xs ${registerRole === "consumer" ? "text-[#0f1a13]/70" : "text-[var(--muted)]"}`}>
                        Resgatar ofertas
                      </span>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={registerRole === "partner"}
                      onClick={() => setRegisterRole("partner")}
                      className={`grid gap-1 rounded-xl border-2 px-3 py-3 text-left transition-all ${
                        registerRole === "partner"
                          ? "border-[#c9f549] bg-[#c9f549] shadow-sm"
                          : "border-[var(--line)] bg-white hover:border-[#c9f549]/50"
                      }`}
                    >
                      <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${registerRole === "partner" ? "text-[#0f1a13]" : "text-[var(--brand)]"}`}>
                        <Building2 size={15} />
                        Empresa
                      </span>
                      <span className={`text-xs ${registerRole === "partner" ? "text-[#0f1a13]/70" : "text-[var(--muted)]"}`}>
                        Publicar ofertas
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="field" htmlFor="register-name">
                    <span>Seu nome</span>
                    <input id="register-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                  </label>
                  <label className="field" htmlFor="register-email">
                    <span>E-mail</span>
                    <input
                      id="register-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="nome@dominio.com"
                      autoComplete="email"
                      required
                      aria-invalid={emailInvalid}
                      aria-describedby={emailInvalid ? "register-email-error" : undefined}
                    />
                  </label>
                  {emailInvalid && (
                    <p id="register-email-error" className="m-0 -mt-1 text-xs font-bold" style={{ color: "var(--warn)" }} role="alert">
                      Digite um e-mail válido. Ex.: nome@dominio.com
                    </p>
                  )}
                  <label className="field" htmlFor="register-phone">
                    <span>Celular</span>
                    <input
                      id="register-phone"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                      placeholder="(51) 99999-0000"
                      inputMode="numeric"
                      autoComplete="tel"
                      required
                      aria-invalid={phoneInvalid}
                      aria-describedby={phoneInvalid ? "register-phone-error" : undefined}
                    />
                  </label>
                  {phoneInvalid && (
                    <p id="register-phone-error" className="m-0 -mt-1 text-xs font-bold" style={{ color: "var(--warn)" }} role="alert">
                      Digite um celular válido com DDD. Ex.: (51) 99999-0000
                    </p>
                  )}
                  <label className="field" htmlFor="register-password">
                    <span>Senha</span>
                    <div className="relative">
                      <input
                        id="register-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type={showRegisterPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        aria-invalid={passwordInvalid}
                        aria-describedby={passwordInvalid ? "register-password-error" : "register-password-rules"}
                        className="pr-11"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-lg border border-[var(--line)] bg-white p-1.5 text-[var(--muted)]"
                        aria-label={showRegisterPassword ? "Ocultar senha" : "Mostrar senha"}
                        onClick={() => setShowRegisterPassword((current) => !current)}
                      >
                        {showRegisterPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </label>
                  {password.length > 0 && (
                    <div className={`grid gap-1.5 rounded-lg p-2.5 ${
                      passwordValid ? "bg-[#f0fbdf]" : "bg-[#fff8e6]"
                    }`} style={{ border: passwordValid ? "1px solid #c9f549" : "1px solid #eed49a" }}>
                      <p id="register-password-rules" className="m-0 text-xs font-semibold text-[#0f1a13]">Senha:</p>
                      <p className="m-0 text-xs" style={{ color: hasMinLength(password) ? "var(--success-text)" : "var(--muted)" }}>
                        {hasMinLength(password) ? "✓" : "○"} Mínimo 6 caracteres
                      </p>
                      <p className="m-0 text-xs" style={{ color: hasLetters(password) ? "var(--success-text)" : "var(--muted)" }}>
                        {hasLetters(password) ? "✓" : "○"} Pelo menos uma letra
                      </p>
                      <p className="m-0 text-xs" style={{ color: hasNumbers(password) ? "var(--success-text)" : "var(--muted)" }}>
                        {hasNumbers(password) ? "✓" : "○"} Pelo menos um número
                      </p>
                    </div>
                  )}
                </div>

                {registerRole === "consumer" && (
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-[#0f1a13]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                      Seu bairro <span className="text-xs font-normal text-[var(--muted)]">(Zona Norte)</span>
                    </label>
                    <NeighborhoodDropdown
                      id="consumer-neighborhood"
                      value={consumerNeighborhood}
                      onChange={setConsumerNeighborhood}
                    />
                  </div>
                )}

                {registerRole === "partner" && (
                  <div className="grid gap-3 rounded-xl border border-[var(--line)] bg-[#f8fbf4] p-3">
                    <p className="m-0 text-sm font-bold text-[var(--brand)]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Dados da empresa</p>
                    <label className="field" htmlFor="register-company-name">
                      <span>Nome da empresa</span>
                      <input id="register-company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                    </label>
                    <div className="grid gap-1.5">
                      <label className="text-sm font-semibold text-[#0f1a13]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                        Categorias <span className="text-xs font-normal text-[var(--muted)]">(multi-select)</span>
                      </label>
                      <CategoryMultiSelect
                        id="register-company-category"
                        value={companyCategory}
                        search={companyCategorySearch}
                        onSearchChange={setCompanyCategorySearch}
                        onToggle={(cat) => {
                          setCompanyCategory((current) =>
                            current.includes(cat)
                              ? current.filter((c) => c !== cat)
                              : [...current, cat]
                          );
                        }}
                      />
                      <p className="m-0 text-xs text-[var(--muted)]">Selecione pelo menos uma categoria para a sua empresa.</p>
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-sm font-semibold text-[#0f1a13]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                        Bairro da empresa <span className="text-xs font-normal text-[var(--muted)]">(Zona Norte)</span>
                      </label>
                      <NeighborhoodDropdown
                        id="company-neighborhood"
                        value={companyNeighborhood}
                        onChange={setCompanyNeighborhood}
                      />
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={isSubmitting || !passwordValid}
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Carregando...
                    </span>
                  ) : !passwordValid ? (
                    "Complete a senha para continuar"
                  ) : (
                    "Cadastrar"
                  )}
                </button>

                <p className="m-0 text-center text-xs text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                  Ao clicar em &quot;Cadastrar&quot;, você declara que leu e aceita os{" "}
                  <button
                    type="button"
                    onClick={() => setLegalModal("termos")}
                    className="font-bold text-[var(--brand)] underline underline-offset-2"
                  >
                    Termos de Uso
                  </button>
                  {" "}e a{" "}
                  <button
                    type="button"
                    onClick={() => setLegalModal("privacidade")}
                    className="font-bold text-[var(--brand)] underline underline-offset-2"
                  >
                    Política de Privacidade
                  </button>
                  .
                </p>
              </form>
            </div>
          )}

          {error && (
            <p className="status-error" role="alert" aria-live="assertive" style={{ margin: 0 }}>
              {error}
            </p>
          )}
          {info && (
            <p className="status-success" role="status" aria-live="polite" style={{ margin: 0 }}>
              {info}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  );
}
