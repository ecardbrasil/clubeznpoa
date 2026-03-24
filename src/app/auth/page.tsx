"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { useToast } from "@/components/ui/toast";
import { initStorage, resetDemoData, routeByRole, signIn, signUp } from "@/lib/storage";

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

  useEffect(() => {
    initStorage();
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const user = signIn(identifier, password);
    if (!user) {
      setError("Credenciais inválidas.");
      showToast("Credenciais inválidas.", "error");
      return;
    }

    showToast("Login realizado com sucesso.", "success");
    router.push(routeByRole(user.role));
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const response = signUp({
      name,
      email,
      phone,
      neighborhood: registerRole === "consumer" ? consumerNeighborhood : undefined,
      password,
      role: registerRole,
      companyName,
      companyCategory,
      companyNeighborhood,
    });

    if (response.error || !response.user) {
      setError(response.error || "Não foi possível criar a conta.");
      showToast(response.error || "Não foi possível criar a conta.", "error");
      return;
    }

    showToast("Conta criada com sucesso.", "success");
    router.push(routeByRole(response.user.role));
  };

  return (
    <main className="clubezn-shell grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <section className="card grid gap-2.5 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <BrandLogo small />
          <Link href="/" className="text-sm font-bold no-underline" style={{ color: "var(--brand-2)" }}>
            Pagina inicial
          </Link>
        </div>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
          Clube de vantagens para moradores da Zona Norte de Porto Alegre.
        </p>
      </section>

      <section className="card grid gap-3">
        <div className="grid grid-cols-2 gap-2">
          <button className={`btn ${mode === "login" ? "btn-primary" : "btn-ghost"}`} onClick={() => setMode("login")}>
            Entrar
          </button>
          <button className={`btn ${mode === "register" ? "btn-primary" : "btn-ghost"}`} onClick={() => setMode("register")}>
            Criar Conta
          </button>
        </div>

        {mode === "login" && (
          <form onSubmit={handleLogin} style={{ display: "grid", gap: 10 }}>
            <label className="field">
              <span>E-mail ou Celular</span>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="cliente@clubezn.com ou 51999990002"
                required
              />
            </label>

            <label className="field">
              <span>Senha</span>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </label>

            <button className="btn btn-primary" type="submit">
              Acessar
            </button>
          </form>
        )}

        {mode === "register" && (
          <form onSubmit={handleRegister} className="grid gap-2.5">
            <label className="field">
              <span>Tipo de conta</span>
              <select
                value={registerRole}
                onChange={(e) => setRegisterRole(e.target.value as RegisterRole)}
              >
                <option value="consumer">Consumidor</option>
                <option value="partner">Empresa Parceira</option>
              </select>
            </label>

            <label className="field">
              <span>Nome</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>

            <label className="field">
              <span>E-mail</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </label>

            <label className="field">
              <span>Celular</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="51999990000" />
            </label>

            <label className="field">
              <span>Senha</span>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </label>

            {registerRole === "consumer" && (
              <label className="field">
                <span>Bairro (Zona Norte)</span>
                <select
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
            )}

            {registerRole === "partner" && (
              <>
                <label className="field">
                  <span>Nome da Empresa</span>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                </label>

                <label className="field">
                  <span>Categoria</span>
                  <input value={companyCategory} onChange={(e) => setCompanyCategory(e.target.value)} required />
                </label>

                <label className="field">
                  <span>Bairro</span>
                  <select
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
              </>
            )}

            <button className="btn btn-primary" type="submit">
              Criar e Entrar
            </button>
          </form>
        )}

        {error && <p style={{ margin: 0, color: "var(--warn)", fontWeight: 700 }}>{error}</p>}
      </section>

      <section className="card grid gap-2.5">
        <h2 style={{ margin: 0, fontSize: 17 }}>Acesso rápido para demo</h2>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
          Admin: admin@clubezn.com | senha 123456
        </p>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
          Parceiro: parceiro@sarandi.com | senha 123456
        </p>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
          Consumidor: cliente@clubezn.com | senha 123456
        </p>
        <button
          className="btn btn-ghost"
          onClick={() => {
            resetDemoData();
            setError("Dados de demonstração reiniciados.");
            showToast("Dados de demonstração reiniciados.", "info");
          }}
          type="button"
        >
          Reiniciar dados da demo
        </button>
      </section>

      <footer className="card grid gap-1.5 lg:col-span-2" style={{ fontSize: 12, color: "var(--muted)" }}>
        <BrandLogo small />
        <p style={{ margin: 0 }}>ClubeZN - Zona Norte de Porto Alegre</p>
      </footer>
    </main>
  );
}
