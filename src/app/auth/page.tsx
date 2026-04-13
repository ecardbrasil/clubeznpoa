"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Eye, EyeOff, Loader2, MapPin, UserRound } from "lucide-react";
import { PublicPageHeader } from "@/components/public-page-header";
import { useToast } from "@/components/ui/toast";
import {
  initStorage,
  resetPasswordWithProvider,
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
];

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
const isValidPhone = (digits: string) => digits.length === 10 || digits.length === 11;
const hasLetters = (value: string) => /[A-Za-z]/.test(value);
const hasNumbers = (value: string) => /\d/.test(value);
const hasMinLength = (value: string) => value.length >= 6;
const isReasonablePassword = (value: string) => hasMinLength(value) && hasLetters(value) && hasNumbers(value);

const getNeighborhoodByCoordinates = async (latitude: number, longitude: number) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
    { headers: { "Accept-Language": "pt-BR" } },
  );
  if (!response.ok) return "";
  const payload = (await response.json()) as {
    address?: {
      suburb?: string;
      neighbourhood?: string;
      city_district?: string;
      quarter?: string;
    };
  };
  const address = payload.address;
  if (!address) return "";
  return address.suburb ?? address.neighbourhood ?? address.city_district ?? address.quarter ?? "";
};

export default function Home() {
  const router = useRouter();
  const { showToast } = useToast();

  const [mode, setMode] = useState<Mode>("login");
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
  const [companyCategory, setCompanyCategory] = useState("");
  const [companyNeighborhood, setCompanyNeighborhood] = useState("Sarandi");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [detectedNeighborhood, setDetectedNeighborhood] = useState<string | null>(null);
  const [showNeighborhoodSuggestion, setShowNeighborhoodSuggestion] = useState(false);

  const [showRecoverPassword, setShowRecoverPassword] = useState(false);
  const [showRecoverConfirmPassword, setShowRecoverConfirmPassword] = useState(false);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [recoverIdentifier, setRecoverIdentifier] = useState("");
  const [recoverNewPassword, setRecoverNewPassword] = useState("");
  const [recoverConfirmPassword, setRecoverConfirmPassword] = useState("");

  const phoneDigits = extractPhoneDigits(phone);
  const emailInvalid = email.trim().length > 0 && !isValidEmail(email);
  const phoneInvalid = phoneDigits.length > 0 && !isValidPhone(phoneDigits);
  const passwordInvalid = mode === "register" && password.length > 0 && !isReasonablePassword(password);

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

  const suggestNeighborhoodFromLocation = () => {
    if (!("geolocation" in navigator)) {
      const message = "Seu navegador não suporta geolocalização.";
      setError(message);
      showToast(message, "error");
      return;
    }

    setError("");
    setInfo("");
    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const rawNeighborhood = await getNeighborhoodByCoordinates(position.coords.latitude, position.coords.longitude);
          if (!rawNeighborhood.trim()) {
            showToast("Não foi possível identificar seu bairro automaticamente.", "info");
            return;
          }

          const matched = northZoneNeighborhoods.find(
            (item) => normalizeText(item) === normalizeText(rawNeighborhood) || normalizeText(rawNeighborhood).includes(normalizeText(item)),
          );

          if (!matched) {
            showToast("Seu bairro não foi identificado na Zona Norte automaticamente.", "info");
            return;
          }

          setDetectedNeighborhood(matched);
          setShowNeighborhoodSuggestion(true);
          setInfo(`Bairro sugerido: ${matched}.`);
        } catch {
          showToast("Falha ao consultar sua localização.", "error");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        showToast("Permissão de localização negada.", "info");
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 30 * 60 * 1000,
      },
    );
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setInfo("");

    if (!identifierTrimmed) {
      const message = "Informe e-mail ou celular.";
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

  const handleRecoverPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError("");
    setInfo("");

    if (!recoverIdentifierTrimmed) {
      const message = "Informe o e-mail ou celular da conta.";
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
      const response = await resetPasswordWithProvider(normalizedIdentifier, recoverNewPassword);
      if (response.error) {
        setError(response.error);
        showToast(response.error, "error");
        return;
      }

      setRecoverOpen(false);
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

    if (!email.trim() && !phoneDigits) {
      const message = "Informe ao menos e-mail ou celular.";
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
      const message = "Senha fraca. Use pelo menos 6 caracteres com letras e números.";
      setError(message);
      showToast(message, "error");
      return;
    }
    if (!termsAccepted) {
      const message = "Você precisa aceitar os termos de uso e a política de privacidade.";
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
        companyCategory: companyCategory.trim(),
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
      <PublicPageHeader subtitle="Acesso e cadastro da plataforma" smallLogo />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="card grid gap-3 self-start">
          <div className="grid gap-1">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">ClubeZN</p>
            <h1 className="m-0 text-2xl font-black text-[#102113] md:text-3xl">Entre para economizar na Zona Norte.</h1>
            <p className="m-0 text-sm text-[var(--muted)]">
              Faça login para resgatar benefícios ou crie sua conta em poucos passos.
            </p>
          </div>

          <div className="grid gap-2 rounded-xl border border-[var(--line)] bg-[#f8fbf4] p-3">
            <p className="m-0 text-sm font-bold text-[var(--brand)]">Como funciona</p>
            <p className="m-0 text-sm text-[var(--muted)]">1. Escolha seu tipo de conta (consumidor ou parceiro).</p>
            <p className="m-0 text-sm text-[var(--muted)]">2. Preencha seus dados de acesso.</p>
            <p className="m-0 text-sm text-[var(--muted)]">3. Entre e acesse seu painel automaticamente.</p>
          </div>
        </section>

        <section className="card grid gap-3">
          <div role="tablist" aria-label="Escolha entre login e cadastro" className="grid grid-cols-2 gap-2">
            <button
              id="tab-login"
              role="tab"
              type="button"
              aria-selected={mode === "login"}
              aria-controls="panel-login"
              className={`btn ${mode === "login" ? "btn-primary" : "btn-ghost"}`}
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
              className={`btn ${mode === "register" ? "btn-primary" : "btn-ghost"}`}
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
            <div id="panel-login" role="tabpanel" aria-labelledby="tab-login" className="grid gap-2.5">
              <form onSubmit={handleLogin} className="grid gap-2.5" noValidate>
                <div className="grid gap-1">
                  <h2 className="m-0 text-lg font-extrabold text-[#102113]">Acessar conta</h2>
                  <p className="m-0 text-sm text-[var(--muted)]">Use e-mail ou celular já cadastrados.</p>
                </div>

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
                  <p id="login-identifier-error" className="m-0 text-xs font-bold text-[#a65200]" role="alert">
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
                className="text-left text-sm font-bold text-[var(--brand)] underline underline-offset-2"
                onClick={() => {
                  setRecoverOpen((current) => !current);
                  setError("");
                  setInfo("");
                }}
              >
                {recoverOpen ? "Fechar recuperação de senha" : "Esqueci minha senha"}
              </button>

              {recoverOpen && (
                <form onSubmit={handleRecoverPassword} className="grid gap-2 rounded-xl border border-[var(--line)] bg-[#f8fbf4] p-3" noValidate>
                  <p className="m-0 text-sm font-bold text-[var(--brand)]">Redefinir senha</p>

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
                    <p id="recover-identifier-error" className="m-0 text-xs font-bold text-[#a65200]" role="alert">
                      Digite um e-mail válido ou celular com DDD.
                    </p>
                  )}

                  <label className="field" htmlFor="recover-new-password">
                    <span>Nova senha</span>
                    <div className="relative">
                      <input
                        id="recover-new-password"
                        value={recoverNewPassword}
                        onChange={(e) => setRecoverNewPassword(e.target.value)}
                        type={showRecoverPassword ? "text" : "password"}
                        autoComplete="new-password"
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
                    <p id="recover-confirm-error" className="m-0 text-xs font-bold text-[#a65200]" role="alert">
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
                </form>
              )}
            </div>
          )}

          {mode === "register" && (
            <div id="panel-register" role="tabpanel" aria-labelledby="tab-register" className="grid gap-2.5">
              <form onSubmit={handleRegister} className="grid gap-2.5" noValidate>
                <div className="grid gap-1">
                  <h2 className="m-0 text-lg font-extrabold text-[#102113]">Criar nova conta</h2>
                  <p className="m-0 text-sm text-[var(--muted)]">Preencha os dados de acesso e o perfil da conta.</p>
                </div>

                <div className="grid gap-2" role="radiogroup" aria-label="Tipo de conta">
                  <span className="text-sm font-semibold text-[#314634]">Tipo de conta</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={registerRole === "consumer"}
                      onClick={() => setRegisterRole("consumer")}
                      className={`grid gap-1 rounded-xl border px-3 py-2 text-left ${
                        registerRole === "consumer" ? "border-[#b7d84b] bg-[#f3fbd8]" : "border-[var(--line)] bg-white"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand)]">
                        <UserRound size={16} />
                        Consumidor
                      </span>
                      <span className="text-xs text-[var(--muted)]">Quero resgatar ofertas e benefícios.</span>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={registerRole === "partner"}
                      onClick={() => setRegisterRole("partner")}
                      className={`grid gap-1 rounded-xl border px-3 py-2 text-left ${
                        registerRole === "partner" ? "border-[#b7d84b] bg-[#f3fbd8]" : "border-[var(--line)] bg-white"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand)]">
                        <Building2 size={16} />
                        Empresa parceira
                      </span>
                      <span className="text-xs text-[var(--muted)]">Quero publicar ofertas para clientes.</span>
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 rounded-xl border border-[var(--line)] bg-[#f8fbf4] p-3">
                  <p className="m-0 text-sm font-bold text-[var(--brand)]">Dados de acesso</p>
                  <div className="grid gap-2 md:grid-cols-2">
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
                        autoComplete="email"
                        aria-invalid={emailInvalid}
                        aria-describedby={emailInvalid ? "register-email-error" : undefined}
                      />
                    </label>
                  </div>
                  {emailInvalid && (
                    <p id="register-email-error" className="m-0 text-xs font-bold text-[#a65200]" role="alert">
                      Digite um e-mail válido. Ex.: nome@dominio.com
                    </p>
                  )}

                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="field" htmlFor="register-phone">
                      <span>Celular</span>
                      <input
                        id="register-phone"
                        value={phone}
                        onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                        placeholder="(51) 99999-0000"
                        inputMode="numeric"
                        autoComplete="tel"
                        aria-invalid={phoneInvalid}
                        aria-describedby={phoneInvalid ? "register-phone-error" : undefined}
                      />
                    </label>
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
                  </div>

                  {phoneInvalid && (
                    <p id="register-phone-error" className="m-0 text-xs font-bold text-[#a65200]" role="alert">
                      Digite o celular com DDD (10 ou 11 dígitos).
                    </p>
                  )}

                  <div className="grid gap-1">
                    <p id="register-password-rules" className="m-0 text-xs text-[var(--muted)]">
                      Senha: mínimo de 6 caracteres, com letras e números.
                    </p>
                    <p className={`m-0 text-xs ${hasMinLength(password) ? "text-[var(--brand)]" : "text-[#a65200]"}`}>
                      {hasMinLength(password) ? "✓" : "○"} Mínimo de 6 caracteres
                    </p>
                    <p className={`m-0 text-xs ${hasLetters(password) ? "text-[var(--brand)]" : "text-[#a65200]"}`}>
                      {hasLetters(password) ? "✓" : "○"} Pelo menos uma letra
                    </p>
                    <p className={`m-0 text-xs ${hasNumbers(password) ? "text-[var(--brand)]" : "text-[#a65200]"}`}>
                      {hasNumbers(password) ? "✓" : "○"} Pelo menos um número
                    </p>
                  </div>

                  {passwordInvalid && (
                    <p id="register-password-error" className="m-0 text-xs font-bold text-[#a65200]" role="alert">
                      Senha fraca. Combine pelo menos uma letra e um número.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost !w-auto !px-3 !py-2"
                    onClick={suggestNeighborhoodFromLocation}
                    disabled={locationLoading}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {locationLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                      Usar minha localização
                    </span>
                  </button>
                </div>

                {showNeighborhoodSuggestion && detectedNeighborhood && (
                  <div className="grid gap-2 rounded-xl border border-[var(--line)] bg-[#f8fbf4] p-3">
                    <p className="m-0 text-sm font-bold text-[var(--brand)]">Você mora no bairro {detectedNeighborhood}?</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-primary !w-auto !px-3 !py-2"
                        onClick={() => {
                          setConsumerNeighborhood(detectedNeighborhood);
                          setCompanyNeighborhood(detectedNeighborhood);
                          setShowNeighborhoodSuggestion(false);
                        }}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost !w-auto !px-3 !py-2"
                        onClick={() => setShowNeighborhoodSuggestion(false)}
                      >
                        Não, alterar
                      </button>
                    </div>
                  </div>
                )}

                {registerRole === "consumer" && (
                  <div className="grid gap-2 rounded-xl border border-[var(--line)] bg-white p-3">
                    <p className="m-0 text-sm font-bold text-[var(--brand)]">Perfil do consumidor</p>
                    <label className="field" htmlFor="register-consumer-neighborhood">
                      <span>Bairro (Zona Norte)</span>
                      <select
                        id="register-consumer-neighborhood"
                        value={consumerNeighborhood}
                        onChange={(e) => setConsumerNeighborhood(e.target.value)}
                        required
                      >
                        {northZoneNeighborhoods.map((neighborhood) => (
                          <option key={neighborhood} value={neighborhood}>
                            {neighborhood}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                {registerRole === "partner" && (
                  <div className="grid gap-2 rounded-xl border border-[var(--line)] bg-white p-3">
                    <p className="m-0 text-sm font-bold text-[var(--brand)]">Dados da empresa parceira</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      <label className="field" htmlFor="register-company-name">
                        <span>Nome da empresa</span>
                        <input id="register-company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                      </label>
                      <label className="field" htmlFor="register-company-category">
                        <span>Categoria</span>
                        <input
                          id="register-company-category"
                          value={companyCategory}
                          onChange={(e) => setCompanyCategory(e.target.value)}
                          required
                        />
                      </label>
                    </div>
                    <label className="field" htmlFor="register-company-neighborhood">
                      <span>Bairro</span>
                      <select
                        id="register-company-neighborhood"
                        value={companyNeighborhood}
                        onChange={(e) => setCompanyNeighborhood(e.target.value)}
                        required
                      >
                        {northZoneNeighborhoods.map((neighborhood) => (
                          <option key={neighborhood} value={neighborhood}>
                            {neighborhood}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                <label className="flex items-start gap-2 rounded-xl border border-[var(--line)] bg-white p-3 text-sm text-[#314634]" htmlFor="register-terms">
                  <input
                    id="register-terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4"
                  />
                  <span>
                    Li e aceito os <Link href="/termos-de-uso" className="font-bold text-[var(--brand)]">termos de uso</Link> e a{" "}
                    <Link href="/privacidade" className="font-bold text-[var(--brand)]">política de privacidade</Link>.
                  </span>
                </label>

                <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Carregando...
                    </span>
                  ) : (
                    "Criar e entrar"
                  )}
                </button>
              </form>
            </div>
          )}

          {error && (
            <p style={{ margin: 0, color: "var(--warn)", fontWeight: 700 }} role="alert" aria-live="assertive">
              {error}
            </p>
          )}
          {info && (
            <p style={{ margin: 0, color: "#1f5f30", fontWeight: 700 }} role="status" aria-live="polite">
              {info}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

