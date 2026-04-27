"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConsumerDashboardSidebar, ConsumerSection } from "@/components/consumer/dashboard-sidebar";
import { useToast } from "@/components/ui/toast";
import { isSupabaseMode } from "@/lib/runtime-config";
import {
  clearSession,
  generateRedemption,
  getAuthHeaders,
  getCurrentUser,
  getData,
  routeByRole,
  syncRedemptionExpirations,
  updateConsumerProfile,
} from "@/lib/storage";
import type { AppData, Company, Offer, Redemption, User } from "@/lib/types";

type RedemptionFilter = "all" | "generated" | "used" | "expired";

type ConsumerApiResponse = {
  data?: AppData;
  user?: User;
  redemption?: Redemption;
  error?: string;
};

type EnrichedRedemption = {
  redemption: Redemption;
  offer?: Offer;
  company?: Company;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
};

const getStatusLabel = (status: Redemption["status"]) => {
  if (status === "generated") return "Gerado";
  if (status === "used") return "Usado";
  return "Expirado";
};

const getStatusBadgeClass = (status: Redemption["status"]) => {
  if (status === "used") return "badge-ok";
  if (status === "generated") return "badge-pending";
  return "badge-danger";
};

const remainingTimeLabel = (expiresAt?: string) => {
  if (!expiresAt) return "Sem expiração";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expirado";
  const minutes = Math.floor(diff / 60_000);
  if (minutes <= 0) return "Menos de 1 min";
  return `${minutes} min restantes`;
};

const isEmailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());
const phoneDigits = (value: string) => value.replace(/\D/g, "").slice(0, 11);
const isPhoneValid = (value: string) => {
  const digits = phoneDigits(value);
  return digits.length === 10 || digits.length === 11;
};

export default function ConsumerPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("clubezn_consumer_sidebar_open_v1");
    if (stored === null) return true;
    return stored === "1";
  });
  const [section, setSection] = useState<ConsumerSection>("overview");
  const [historyFilter, setHistoryFilter] = useState<RedemptionFilter>("all");
  const [loadingData, setLoadingData] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [profileFeedback, setProfileFeedback] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [neighborhood, setNeighborhood] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("clubezn_consumer_sidebar_open_v1", sidebarOpen ? "1" : "0");
  }, [sidebarOpen]);

  const loadData = async (activeUser: User) => {
    if (!isSupabaseMode) {
      syncRedemptionExpirations();
      setData(getData());
      return;
    }

    const response = await fetch("/api/consumer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        action: "getData",
        userId: activeUser.id,
      }),
    });

    const payload = (await response.json()) as ConsumerApiResponse;
    if (!response.ok || payload.error || !payload.data) {
      throw new Error(payload.error || "Falha ao carregar painel do consumidor.");
    }
    setData(payload.data);
  };

  const refresh = async () => {
    if (!user) return;
    try {
      await loadData(user);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Falha ao atualizar dados do consumidor.", "error");
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.replace("/auth");
      return;
    }
    if (currentUser.role !== "consumer") {
      router.replace(routeByRole(currentUser.role));
      return;
    }
    setUser(currentUser);
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!user) return;
      setLoadingData(true);
      try {
        await loadData(user);
      } catch (error) {
        if (!cancelled) {
          setData(null);
          showToast(error instanceof Error ? error.message : "Falha ao carregar painel do consumidor.", "error");
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [showToast, user]);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
    setNeighborhood(user.neighborhood ?? "");
  }, [user]);

  const consumerRedemptions = useMemo(() => {
    if (!data || !user) return [];
    return data.redemptions
      .filter((item) => item.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data, user]);

  const activeOffers = useMemo(() => {
    if (!data) return [];
    return data.offers
      .filter((offer) => offer.approved && !offer.rejected)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data]);

  const offersById = useMemo(() => new Map(activeOffers.map((offer) => [offer.id, offer])), [activeOffers]);
  const companiesById = useMemo(() => {
    if (!data) return new Map<string, Company>();
    return new Map(data.companies.map((company) => [company.id, company]));
  }, [data]);

  const enrichedHistory = useMemo<EnrichedRedemption[]>(() => {
    return consumerRedemptions.map((redemption) => {
      const offer = offersById.get(redemption.offerId);
      const company = offer ? companiesById.get(offer.companyId) : undefined;
      return { redemption, offer, company };
    });
  }, [companiesById, consumerRedemptions, offersById]);

  const historyByFilter = useMemo(() => {
    if (historyFilter === "all") return enrichedHistory;
    return enrichedHistory.filter((item) => item.redemption.status === historyFilter);
  }, [enrichedHistory, historyFilter]);

  const activeCodes = useMemo(
    () =>
      enrichedHistory.filter(
        (item) => item.redemption.status === "generated" && new Date(item.redemption.expiresAt).getTime() > Date.now(),
      ),
    [enrichedHistory],
  );

  const totalGenerated = consumerRedemptions.length;
  const totalUsed = consumerRedemptions.filter((item) => item.status === "used").length;
  const totalExpired = consumerRedemptions.filter((item) => item.status === "expired").length;

  const latestCodeByOfferId = useMemo(() => {
    const map = new Map<string, Redemption>();
    for (const redemption of consumerRedemptions) {
      if (!map.has(redemption.offerId)) {
        map.set(redemption.offerId, redemption);
      }
    }
    return map;
  }, [consumerRedemptions]);

  const generateCodeForOffer = async (offerId: string) => {
    if (!user) return;
    setBusyOfferId(offerId);

    try {
      if (isSupabaseMode) {
        const response = await fetch("/api/consumer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            action: "generateCode",
            userId: user.id,
            offerId,
          }),
        });
        const payload = (await response.json()) as ConsumerApiResponse;
        if (!response.ok || payload.error) {
          throw new Error(payload.error || "Falha ao gerar código de resgate.");
        }
      } else {
        generateRedemption(user.id, offerId);
      }

      showToast("Código gerado com sucesso.", "success");
      setSection("history");
      await refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Falha ao gerar código.", "error");
    } finally {
      setBusyOfferId(null);
    }
  };

  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || savingProfile) return;

    setProfileFeedback("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phoneDigits(phone);
    const normalizedNeighborhood = neighborhood.trim();

    if (!normalizedName) {
      const message = "Informe seu nome.";
      setProfileFeedback(message);
      showToast(message, "error");
      return;
    }
    if (!normalizedEmail && !normalizedPhone) {
      const message = "Informe e-mail ou celular.";
      setProfileFeedback(message);
      showToast(message, "error");
      return;
    }
    if (normalizedEmail && !isEmailValid(normalizedEmail)) {
      const message = "Informe um e-mail válido.";
      setProfileFeedback(message);
      showToast(message, "error");
      return;
    }
    if (normalizedPhone && !isPhoneValid(normalizedPhone)) {
      const message = "Informe um celular válido com DDD.";
      setProfileFeedback(message);
      showToast(message, "error");
      return;
    }

    setSavingProfile(true);
    try {
      if (isSupabaseMode) {
        const response = await fetch("/api/consumer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            action: "updateProfile",
            userId: user.id,
            payload: {
              name: normalizedName,
              email: normalizedEmail || undefined,
              phone: normalizedPhone || undefined,
              neighborhood: normalizedNeighborhood || undefined,
            },
          }),
        });

        const payload = (await response.json()) as ConsumerApiResponse;
        if (!response.ok || payload.error || !payload.user) {
          throw new Error(payload.error || "Falha ao atualizar perfil.");
        }
        setUser(payload.user);
      } else {
        const output = updateConsumerProfile(user.id, {
          name: normalizedName,
          email: normalizedEmail || undefined,
          phone: normalizedPhone || undefined,
          neighborhood: normalizedNeighborhood || undefined,
        });
        if (output.error || !output.user) {
          throw new Error(output.error || "Falha ao atualizar perfil.");
        }
        setUser(output.user);
      }

      setProfileFeedback("Perfil atualizado com sucesso.");
      showToast("Perfil atualizado com sucesso.", "success");
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar perfil.";
      setProfileFeedback(message);
      showToast(message, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user || loadingData) return <main className="clubezn-shell">Carregando...</main>;

  return (
    <main className="clubezn-shell grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
      <ConsumerDashboardSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        section={section}
        onSectionChange={setSection}
        consumerName={user.name}
        onLogout={() => {
          clearSession();
          router.push("/auth");
        }}
      />

      <div className="grid gap-3">
        <section className="card grid gap-1">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Painel do consumidor</p>
          <h1 className="m-0 text-2xl font-black text-[#102113]">Olá, {user.name.split(" ")[0]}.</h1>
          <p className="m-0 text-sm text-[var(--muted)]">
            Acompanhe seus códigos, gere novos resgates e mantenha seu perfil atualizado.
          </p>
        </section>

        {section === "overview" && (
          <>
            <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Códigos gerados" value={totalGenerated} helper="Total acumulado" />
              <MetricCard label="Códigos ativos" value={activeCodes.length} helper="Ainda válidos" />
              <MetricCard label="Códigos usados" value={totalUsed} helper="Resgates concluídos" />
              <MetricCard label="Códigos expirados" value={totalExpired} helper="Perderam validade" />
            </section>

            <section className="card grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 style={{ margin: 0, fontSize: 18 }}>Códigos ativos agora</h2>
                <button className="btn btn-ghost !w-auto !px-3 !py-1.5" onClick={() => setSection("history")} type="button">
                  Ver histórico completo
                </button>
              </div>

              {activeCodes.slice(0, 5).map((item) => (
                <article key={item.redemption.id} className="grid gap-1.5 border-t pt-2" style={{ borderColor: "var(--line)" }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p style={{ margin: 0, fontWeight: 700 }}>{item.offer?.title ?? "Oferta indisponível"}</p>
                    <span className="badge badge-pending">Código {item.redemption.code}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                    {item.company?.publicName ?? item.company?.name ?? "Parceiro"} • {remainingTimeLabel(item.redemption.expiresAt)}
                  </p>
                </article>
              ))}

              {activeCodes.length === 0 && (
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  Você não tem códigos ativos no momento. Gere um novo código na seção de ofertas.
                </p>
              )}
            </section>

            <section className="card grid gap-2">
              <h2 style={{ margin: 0, fontSize: 18 }}>Ações rápidas</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                <button className="btn btn-primary" onClick={() => setSection("offers")} type="button">
                  Gerar novo código
                </button>
                <Link href="/ofertas" className="btn btn-ghost text-center">
                  Abrir vitrine completa
                </Link>
              </div>
            </section>
          </>
        )}

        {section === "history" && (
          <section className="card grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 style={{ margin: 0, fontSize: 18 }}>Meus códigos gerados</h2>
              <select
                value={historyFilter}
                onChange={(event) => setHistoryFilter(event.target.value as RedemptionFilter)}
                style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "8px 10px", background: "#fff" }}
              >
                <option value="all">Todos</option>
                <option value="generated">Ativos</option>
                <option value="used">Usados</option>
                <option value="expired">Expirados</option>
              </select>
            </div>

            {historyByFilter.map((item) => (
              <article key={item.redemption.id} className="grid gap-1.5 border-t pt-2" style={{ borderColor: "var(--line)" }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p style={{ margin: 0, fontWeight: 700 }}>{item.offer?.title ?? "Oferta indisponível"}</p>
                  <span className={`badge ${getStatusBadgeClass(item.redemption.status)}`}>{getStatusLabel(item.redemption.status)}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13 }}>
                  Código <strong>{item.redemption.code}</strong> • {item.company?.publicName ?? item.company?.name ?? "Parceiro"}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                  Criado em {formatDate(item.redemption.createdAt)} • Expira em {formatDate(item.redemption.expiresAt)}
                </p>
              </article>
            ))}

            {historyByFilter.length === 0 && (
              <p style={{ margin: 0, color: "var(--muted)" }}>Nenhum código encontrado para este filtro.</p>
            )}
          </section>
        )}

        {section === "offers" && (
          <section className="card grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 style={{ margin: 0, fontSize: 18 }}>Ofertas para gerar código</h2>
              <Link href="/ofertas" className="btn btn-ghost !w-auto !px-3 !py-1.5 text-center">
                Ver vitrine completa
              </Link>
            </div>

            {activeOffers.map((offer) => {
              const company = companiesById.get(offer.companyId);
              const latestRedemption = latestCodeByOfferId.get(offer.id);
              return (
                <article key={offer.id} className="grid gap-1.5 border-t pt-2" style={{ borderColor: "var(--line)" }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p style={{ margin: 0, fontWeight: 700 }}>{offer.title}</p>
                    <span className="badge badge-ok">{offer.discountLabel}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                    {company?.publicName ?? company?.name ?? "Parceiro"} • {offer.category} • {offer.neighborhood}
                  </p>
                  <p style={{ margin: 0, fontSize: 13 }}>{offer.description}</p>
                  {latestRedemption ? (
                    <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                      Último código: {latestRedemption.code} ({getStatusLabel(latestRedemption.status)} em{" "}
                      {formatDate(latestRedemption.createdAt)})
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="btn btn-primary !w-auto !px-3 !py-1.5"
                      type="button"
                      onClick={() => generateCodeForOffer(offer.id)}
                      disabled={busyOfferId === offer.id}
                    >
                      {busyOfferId === offer.id ? "Gerando..." : "Gerar código"}
                    </button>
                  </div>
                </article>
              );
            })}

            {activeOffers.length === 0 && (
              <p style={{ margin: 0, color: "var(--muted)" }}>Não há ofertas disponíveis para resgate no momento.</p>
            )}
          </section>
        )}

        {section === "profile" && (
          <section className="card grid gap-2">
            <h2 style={{ margin: 0, fontSize: 18 }}>Meu perfil</h2>
            <form className="grid gap-2" onSubmit={handleSaveProfile}>
              <label className="field">
                <span>Nome</span>
                <input value={name} onChange={(event) => setName(event.target.value)} required />
              </label>

              <label className="field">
                <span>E-mail</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="nome@dominio.com"
                />
              </label>

              <label className="field">
                <span>Celular</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  inputMode="numeric"
                  placeholder="51999990000"
                />
              </label>

              <label className="field">
                <span>Bairro</span>
                <input value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} placeholder="Seu bairro" />
              </label>

              <button className="btn btn-primary" type="submit" disabled={savingProfile}>
                {savingProfile ? "Salvando..." : "Salvar perfil"}
              </button>
            </form>

            {profileFeedback && <p style={{ margin: 0, fontWeight: 700 }}>{profileFeedback}</p>}
          </section>
        )}
      </div>
    </main>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <article className="card grid gap-1">
      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 30, fontWeight: 800 }}>{value}</p>
      <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{helper}</p>
    </article>
  );
}
