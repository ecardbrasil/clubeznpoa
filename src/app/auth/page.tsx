"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, UserRound } from "lucide-react";
import { PublicPageHeader } from "@/components/public-page-header";
import { useToast } from "@/components/ui/toast";
import { initStorage, routeByRole, signInWithProvider, signUpWithProvider } from "@/lib/storage";

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
const isReasonablePassword = (value: string) => value.length >= 6 && /[A-Za-z]/.test(value) && /\d/.test(value);

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

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consumerNeighborhood, setConsumerNeighborhood] = useState("Sarandi");

  const [companyName, setCompanyName] = useState("");
  const [companyCategory, setCompanyCategory] = useState("");
  const [companyNeighborhood, setCompanyNeighborhood] = useState("Sarandi");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedNeighborhood, setDetectedNeighborhood] = useState<string | null>(null);
  const [showNeighborhoodSuggestion, setShowNeighborhoodSuggestion] = useState(false);

  const phoneDigits = extractPhoneDigits(phone);
  const emailInvalid = email.trim().length > 0 && !isValidEmail(email);
  const phoneInvalid = phoneDigits.length > 0 && !isValidPhone(phoneDigits);
  const passwordInvalid = mode === "register" && password.length > 0 && !isReasonablePassword(password);

  useEffect(() => {
    initStorage();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!("geolocation" in navigator)) return () => undefined;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const rawNeighborhood = await getNeighborhoodByCoordinates(position.coords.latitude, position.coords.longitude);
          if (cancelled || !rawNeighborhood.trim()) return;
          const matched = northZoneNeighborhoods.find(
            (item) => normalizeText(item) === normalizeText(rawNeighborhood) || normalizeText(rawNeighborhood).includes(normalizeText(item)),
          );
          if (!matched) return;
          setDetectedNeighborhood(matched);
          setShowNeighborhoodSuggestion(true);
        } catch {
          // Ignore location lookup failures and keep manual neighborhood selection.
        }
      },
      () => {
        // User denied location or it is unavailable.
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 30 * 60 * 1000,
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    try {
      const normalizedIdentifier = identifier.includes("@") ? identifier.trim().toLowerCase() : extractPhoneDigits(identifier);
      const user = await signInWithProvider(normalizedIdentifier, password);
      if (!user) {
        setError("Credenciais inválidas.");
        showToast("Credenciais inválidas.", "error");
        return;
      }

      showToast("Login realizado com sucesso.", "success");
      router.push(routeByRole(user.role));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");

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

      showToast("Conta criada com sucesso.", "success");
      router.push(routeByRole(response.user.role));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="clubezn-shell grid gap-4">
      <PublicPageHeader
        subtitle="Acesso e cadastro da plataforma"
        smallLogo
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="card grid gap-3 self-start">
          <div className="grid gap-1">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#2b7a3f]">ClubeZN</p>
            <h1 className="m-0 text-2xl font-black text-[#102113] md:text-3xl">Entre para economizar na Zona Norte.</h1>
            <p className="m-0 text-sm text-[#486048]">
              Faça login para resgatar benefícios ou crie sua conta em poucos passos.
            </p>
          </div>

          <div className="grid gap-2 rounded-xl border border-[#dce8de] bg-[#f8fcf8] p-3">
            <p className="m-0 text-sm font-bold text-[#1f5f30]">Como funciona</p>
            <p className="m-0 text-sm text-[#486048]">1. Escolha seu tipo de conta (consumidor ou parceiro).</p>
            <p className="m-0 text-sm text-[#486048]">2. Preencha seus dados de acesso.</p>
            <p className="m-0 text-sm text-[#486048]">3. Entre e acesse seu painel automaticamente.</p>
          </div>

        </section>

        <section className="card grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <button className={`btn ${mode === "login" ? "btn-primary" : "btn-ghost"}`} onClick={() => setMode("login")}>
              Entrar
            </button>
            <button className={`btn ${mode === "register" ? "btn-primary" : "btn-ghost"}`} onClick={() => setMode("register")}>
              Criar conta
            </button>
          </div>

          {mode === "login" && (
            <form onSubmit={handleLogin} className="grid gap-2.5">
              <div className="grid gap-1">
                <h2 className="m-0 text-lg font-extrabold text-[#102113]">Acessar conta</h2>
                <p className="m-0 text-sm text-[#486048]">Use e-mail ou celular já cadastrados.</p>
              </div>

              <label className="field">
                <span>E-mail ou celular</span>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="cliente@clubezn.com ou 51999990002"
                  required
                  autoComplete="username"
                />
              </label>

              <label className="field">
                <span>Senha</span>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required autoComplete="current-password" />
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
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister} className="grid gap-2.5">
              <div className="grid gap-1">
                <h2 className="m-0 text-lg font-extrabold text-[#102113]">Criar nova conta</h2>
                <p className="m-0 text-sm text-[#486048]">Preencha os dados de acesso e o perfil da conta.</p>
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-semibold text-[#314634]">Tipo de conta</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setRegisterRole("consumer")}
                    className={`grid gap-1 rounded-xl border px-3 py-2 text-left ${
                      registerRole === "consumer" ? "border-[#2b7a3f] bg-[#edf8ef]" : "border-[#dbe8de] bg-white"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-[#1f5f30]">
                      <UserRound size={16} />
                      Consumidor
                    </span>
                    <span className="text-xs text-[#486048]">Quero resgatar ofertas e benefícios.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterRole("partner")}
                    className={`grid gap-1 rounded-xl border px-3 py-2 text-left ${
                      registerRole === "partner" ? "border-[#2b7a3f] bg-[#edf8ef]" : "border-[#dbe8de] bg-white"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-[#1f5f30]">
                      <Building2 size={16} />
                      Empresa parceira
                    </span>
                    <span className="text-xs text-[#486048]">Quero publicar ofertas para clientes.</span>
                  </button>
                </div>
              </div>

              <div className="grid gap-2 rounded-xl border border-[#dce8de] bg-[#f8fcf8] p-3">
                <p className="m-0 text-sm font-bold text-[#1f5f30]">Dados de acesso</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="field">
                    <span>Seu nome</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                  </label>
                  <label className="field">
                    <span>E-mail</span>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" />
                  </label>
                </div>
                {emailInvalid && <p className="m-0 text-xs font-bold text-[#a65200]">Digite um e-mail válido. Ex.: nome@dominio.com</p>}
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="field">
                    <span>Celular</span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                      placeholder="(51) 99999-0000"
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                  </label>
                  <label className="field">
                    <span>Senha</span>
                    <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required autoComplete="new-password" />
                  </label>
                </div>
                {phoneInvalid && <p className="m-0 text-xs font-bold text-[#a65200]">Digite o celular com DDD (10 ou 11 dígitos).</p>}
                <p className="m-0 text-xs text-[#486048]">Senha: mínimo de 6 caracteres, com letras e números.</p>
                {passwordInvalid && (
                  <p className="m-0 text-xs font-bold text-[#a65200]">Senha fraca. Combine pelo menos uma letra e um número.</p>
                )}
              </div>

              {showNeighborhoodSuggestion && detectedNeighborhood && (
                <div className="grid gap-2 rounded-xl border border-[#dce8de] bg-[#f6fbff] p-3">
                  <p className="m-0 text-sm font-bold text-[#255e8d]">Você mora no bairro {detectedNeighborhood}?</p>
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
                <div className="grid gap-2 rounded-xl border border-[#dce8de] bg-white p-3">
                  <p className="m-0 text-sm font-bold text-[#1f5f30]">Perfil do consumidor</p>
                  <label className="field">
                    <span>Bairro (Zona Norte)</span>
                    <select value={consumerNeighborhood} onChange={(e) => setConsumerNeighborhood(e.target.value)} required>
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
                <div className="grid gap-2 rounded-xl border border-[#dce8de] bg-white p-3">
                  <p className="m-0 text-sm font-bold text-[#1f5f30]">Dados da empresa parceira</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="field">
                      <span>Nome da empresa</span>
                      <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                    </label>
                    <label className="field">
                      <span>Categoria</span>
                      <input value={companyCategory} onChange={(e) => setCompanyCategory(e.target.value)} required />
                    </label>
                  </div>
                  <label className="field">
                    <span>Bairro</span>
                    <select value={companyNeighborhood} onChange={(e) => setCompanyNeighborhood(e.target.value)} required>
                      {northZoneNeighborhoods.map((neighborhood) => (
                        <option key={neighborhood} value={neighborhood}>
                          {neighborhood}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

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
          )}

          {error && <p style={{ margin: 0, color: "var(--warn)", fontWeight: 700 }}>{error}</p>}
        </section>
      </div>
    </main>
  );
}
