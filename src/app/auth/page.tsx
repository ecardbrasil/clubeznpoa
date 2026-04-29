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
  "Outro",
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
const isValidPhone = (digits: string) => digits.length >= 9 && digits.length <= 11;
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

  const suggestNeighborhoodFromLocation = () => {
    if (!("geolocation" in navigator)) {
      const message = "Seu navegador não suporta geolocalização. Escolha o bairro manualmente.";
      setError(message);
      showToast(message, "info");
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
            showToast("Não conseguimos identificar seu bairro. Escolha manualmente abaixo.", "info");
            setLocationLoading(false);
            return;
          }

          const matched = northZoneNeighborhoods.find(
            (item) => normalizeText(item) === normalizeText(rawNeighborhood) || normalizeText(rawNeighborhood).includes(normalizeText(item)),
          );

          if (!matched) {
            showToast("Seu local está fora da Zona Norte. Escolha um bairro disponível abaixo.", "info");
            setLocationLoading(false);
            return;
          }

          setDetectedNeighborhood(matched);
          setShowNeighborhoodSuggestion(true);
          showToast(`Bairro detectado: ${matched}`, "success");
        } catch {
          showToast("Erro ao detectar localização. Escolha o bairro manualmente.", "error");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        showToast("Você recusou acesso à localização. Sem problema, escolha o bairro manualmente.", "info");
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

  const handleRecoverPassword = async (e: FormEvent) => {
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
    if (!termsAccepted) {
      const message = "Aceite os termos de uso e a política de privacidade para criar sua conta.";
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
      <PublicPageHeader smallLogo />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="card grid gap-3 self-start">
          <div className="grid gap-2">
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-1 w-6 rounded-full"
                  style={{ background: "linear-gradient(90deg, #c9f549 0%, #a8d63a 100%)" }}
                  aria-hidden="true"
                />
                <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand)]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>ClubeZN</p>
              </div>
              <h1 className="m-0 text-2xl md:text-3xl" style={{ fontFamily: "var(--font-poppins), sans-serif", fontWeight: 800, color: "#0f1a13", lineHeight: 1.2 }}>Economize na Zona Norte com ofertas exclusivas.</h1>
              <p className="m-0 text-sm text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                Crie sua conta ou faça login para acessar benefícios e promoções especiais.
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "linear-gradient(135deg, #c9f549 0%, #a8d63a 100%)" }}>
              <p className="m-0 text-sm font-bold text-[#0f1a13]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>✓ Acesso instantâneo a centenas de ofertas</p>
            </div>
          </div>

          <div className="grid gap-2 rounded-xl border border-[var(--line)] bg-[#f8fbf4] p-3">
            <p className="m-0 text-sm font-bold text-[var(--brand)]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Como começar</p>
            <div className="grid gap-2">
              <p className="m-0 text-xs" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>1</span>
                <span className="ml-2">Escolha o tipo de conta (consumidor ou parceiro)</span>
              </p>
              <p className="m-0 text-xs" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>2</span>
                <span className="ml-2">Preencha e-mail ou celular + senha (ou use dados existentes para login)</span>
              </p>
              <p className="m-0 text-xs" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>3</span>
                <span className="ml-2">Confirme os termos e crie sua conta</span>
              </p>
              <p className="m-0 text-xs" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-[#0f1a13]" style={{ background: "linear-gradient(135deg, #c9f549 0%, #a8d63a 100%)", fontFamily: "var(--font-poppins), sans-serif" }}>✓</span>
                <span className="ml-2 font-semibold text-[var(--success-text)]">Acesso instantâneo ao seu painel</span>
              </p>
            </div>
          </div>
        </section>

        <section className="card grid gap-3">
          <div className="grid gap-2">
            <div className="rounded-xl p-3" style={{ background: "var(--success-bg)", border: "1.5px solid var(--success-border)" }}>
              <p className="m-0 text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--success-text)", fontFamily: "var(--font-poppins), sans-serif" }}>Novo por aqui?</p>
              <p className="m-0 text-sm text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                Se é sua primeira vez, comece criando uma conta. Já é membro? Faça login abaixo.
              </p>
            </div>
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
          </div>

          {mode === "login" && (
            <div id="panel-login" role="tabpanel" aria-labelledby="tab-login" className="grid gap-2.5">
              <form onSubmit={handleLogin} className="grid gap-2.5" noValidate>
                <div className="grid gap-1">
                  <h2 className="m-0 text-lg" style={{ fontFamily: "var(--font-poppins), sans-serif", fontWeight: 800, color: "#0f1a13" }}>Acessar conta</h2>
                  <p className="m-0 text-sm text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>Use e-mail ou celular já cadastrados.</p>
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
                  <p id="login-identifier-error" className="m-0 text-xs font-bold" role="alert" style={{ color: "var(--warn)" }}>
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
                style={{ fontFamily: "var(--font-dm), sans-serif" }}
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
                  <p className="m-0 text-sm font-bold text-[var(--brand)]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Redefinir senha</p>

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
                    <p id="recover-identifier-error" className="m-0 text-xs font-bold" style={{ color: "var(--warn)" }} role="alert">
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
                    <p id="recover-confirm-error" className="m-0 text-xs font-bold" style={{ color: "var(--warn)" }} role="alert">
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
                  <h2 className="m-0 text-lg" style={{ fontFamily: "var(--font-poppins), sans-serif", fontWeight: 800, color: "#0f1a13" }}>Criar nova conta</h2>
                  <p className="m-0 text-sm text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>Preencha os dados de acesso e o perfil da conta.</p>
                </div>

                <div className="grid gap-2" role="radiogroup" aria-label="Tipo de conta">
                  <span className="text-sm font-semibold text-[var(--brand)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>Tipo de conta</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={registerRole === "consumer"}
                      onClick={() => setRegisterRole("consumer")}
                      className={`grid gap-1 rounded-xl border px-3 py-2 text-left ${
                        registerRole === "consumer" ? "border-[#c9f549] bg-[#f8fbf4]" : "border-[var(--line)] bg-white"
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
                        registerRole === "partner" ? "border-[#c9f549] bg-[#f8fbf4]" : "border-[var(--line)] bg-white"
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
                  <div className="grid gap-1">
                    <p className="m-0 text-sm font-bold text-[var(--brand)]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Dados de acesso</p>
                    <p className="m-0 text-xs text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>Preencha seu nome, e-mail, celular e senha.</p>
                  </div>
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
                        placeholder="nome@dominio.com"
                        autoComplete="email"
                        required
                        aria-invalid={emailInvalid}
                        aria-describedby={emailInvalid ? "register-email-error" : undefined}
                      />
                    </label>
                  </div>
                  {emailInvalid && (
                    <p id="register-email-error" className="m-0 text-xs font-bold" style={{ color: "var(--warn)" }} role="alert">
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
                        placeholder="(51) 99999-0000 ou 51999990000"
                        inputMode="numeric"
                        autoComplete="tel"
                        required
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
                    <p id="register-phone-error" className="m-0 text-xs font-bold" style={{ color: "var(--warn)" }} role="alert">
                      Digite um celular válido (9 a 11 dígitos). Exemplo: 51999990000 ou (51) 99999-0000
                    </p>
                  )}

                  <div className={`grid gap-2 rounded-lg p-2 ${
                    passwordValid ? "bg-[#f8fbf4]" : password.length > 0 ? "bg-[#fff3d4]" : "bg-white"
                  }`} style={{ border: passwordValid ? "1px solid #c9f549" : password.length > 0 ? "1px solid #eed49a" : "1px solid var(--line)" }}>
                    <p id="register-password-rules" className="m-0 text-xs font-semibold text-[var(--brand)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                      Requisitos da senha:
                    </p>
                    <p className={`m-0 text-xs`} style={{ color: hasMinLength(password) ? "var(--success-text)" : "var(--muted)", fontWeight: hasMinLength(password) ? 600 : 400 }}>
                      {hasMinLength(password) ? "✓" : "○"} Mínimo de 6 caracteres
                    </p>
                    <p className={`m-0 text-xs`} style={{ color: hasLetters(password) ? "var(--success-text)" : "var(--muted)", fontWeight: hasLetters(password) ? 600 : 400 }}>
                      {hasLetters(password) ? "✓" : "○"} Pelo menos uma letra
                    </p>
                    <p className={`m-0 text-xs`} style={{ color: hasNumbers(password) ? "var(--success-text)" : "var(--muted)", fontWeight: hasNumbers(password) ? 600 : 400 }}>
                      {hasNumbers(password) ? "✓" : "○"} Pelo menos um número
                    </p>
                    {passwordValid && (
                      <p className="m-0 text-xs font-bold" style={{ color: "var(--success-text)", fontFamily: "var(--font-poppins), sans-serif" }}>✓ Senha forte!</p>
                    )}
                  </div>

                </div>

                <div className="grid gap-2 rounded-lg border border-[var(--line)] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <p className="m-0 text-sm font-semibold text-[var(--brand)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>Detectar bairro automaticamente</p>
                    <span className="text-xs font-bold text-[var(--muted)]">Opcional</span>
                  </div>
                  <p className="m-0 text-xs text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                    Deixe seu navegador acessar sua localização para sugerirmos seu bairro automaticamente.
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost !w-auto !px-3 !py-2"
                    onClick={suggestNeighborhoodFromLocation}
                    disabled={locationLoading}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {locationLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                      {locationLoading ? "Detectando..." : "Usar minha localização"}
                    </span>
                  </button>
                </div>

                {showNeighborhoodSuggestion && detectedNeighborhood && (
                  <div className="grid gap-2 rounded-xl border-2 border-[#c9f549] bg-[#f8fbf4] p-3">
                    <p className="m-0 text-sm font-bold" style={{ color: "var(--success-text)", fontFamily: "var(--font-poppins), sans-serif" }}>✓ Bairro detectado: {detectedNeighborhood}</p>
                    <p className="m-0 text-xs text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>Usar esta localização?</p>
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
                        Sim, confirmar
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost !w-auto !px-3 !py-2"
                        onClick={() => setShowNeighborhoodSuggestion(false)}
                      >
                        Não, escolher outro
                      </button>
                    </div>
                  </div>
                )}

                {registerRole === "consumer" && (
                  <div className="grid gap-3 rounded-xl border border-[var(--line)] bg-white p-3">
                    <div className="grid gap-1">
                      <p className="m-0 text-sm font-bold text-[var(--brand)]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Qual é seu bairro?</p>
                      <p className="m-0 text-xs text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>Escolha um bairro da Zona Norte</p>
                    </div>
                    <select
                      value={consumerNeighborhood}
                      onChange={(e) => setConsumerNeighborhood(e.target.value)}
                      className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
                    >
                      {northZoneNeighborhoods.map((neighborhood) => (
                        <option key={neighborhood} value={neighborhood}>
                          {neighborhood}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {registerRole === "partner" && (
                  <div className="grid gap-3 rounded-xl border border-[var(--line)] bg-white p-3">
                    <p className="m-0 text-sm font-bold text-[var(--brand)]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Dados da empresa parceira</p>
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
                    <div className="grid gap-2">
                      <div className="grid gap-1">
                        <label htmlFor="register-company-neighborhood" className="text-sm font-semibold text-[var(--brand)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                          Em qual bairro está localizada?
                        </label>
                        <p className="m-0 text-xs text-[var(--muted)]">Escolha um bairro da Zona Norte</p>
                      </div>
                      <select
                        id="register-company-neighborhood"
                        value={companyNeighborhood}
                        onChange={(e) => setCompanyNeighborhood(e.target.value)}
                        className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
                      >
                        {northZoneNeighborhoods.map((neighborhood) => (
                          <option key={neighborhood} value={neighborhood}>
                            {neighborhood}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <label className={`flex items-start gap-3 rounded-xl border-2 p-3 text-sm cursor-pointer transition-colors ${
                  termsAccepted
                    ? "border-[#c9f549] bg-[#f8fbf4] text-[var(--brand)]"
                    : "border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)]"
                }`} style={{ fontFamily: "var(--font-dm), sans-serif" }} htmlFor="register-terms">
                  <input
                    id="register-terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-5 w-5 cursor-pointer"
                  />
                  <span>
                    <strong>Obrigatório:</strong> Li e aceito os <Link href="/termos-de-uso" className="font-bold text-[var(--brand)]">termos de uso</Link> e a{" "}
                    <Link href="/privacidade" className="font-bold text-[var(--brand)]">política de privacidade</Link>.
                  </span>
                </label>

                <button className="btn btn-primary" type="submit" disabled={isSubmitting || !passwordValid}>
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Carregando...
                    </span>
                  ) : !passwordValid ? (
                    "Complete a senha para continuar"
                  ) : (
                    "Criar e entrar"
                  )}
                </button>
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

