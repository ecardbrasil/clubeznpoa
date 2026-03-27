"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboardSidebar, AdminSection } from "@/components/admin/dashboard-sidebar";
import { useToast } from "@/components/ui/toast";
import { isSupabaseMode } from "@/lib/runtime-config";
import { AppData, Company, Offer, Redemption, User, UserRole } from "@/lib/types";
import {
  approveCompany as approveLocalCompany,
  approveOffer as approveLocalOffer,
  blockUser as blockLocalUser,
  clearSession,
  deleteUser as deleteLocalUser,
  deleteOffer as deleteLocalOffer,
  getAuthHeaders,
  getCurrentUser,
  getData,
  rejectOffer as rejectLocalOffer,
  routeByRole,
  syncRedemptionExpirations,
  unblockUser as unblockLocalUser,
  updateUserRole as updateLocalUserRole,
} from "@/lib/storage";

type ActivityItem = {
  id: string;
  createdAt: string;
  label: string;
  detail: string;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
};

const getAgeLabel = (createdAt: string) => {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(ageMs / (1000 * 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} dia(s)`;
};

const sortByCreatedAtDesc = <T extends { createdAt: string }>(items: T[]) =>
  [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

const sortByCreatedAtAsc = <T extends { createdAt: string }>(items: T[]) =>
  [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

const getOfferStatusLabel = (offer: Offer) => {
  if (offer.rejected) return "Rejeitada";
  if (!offer.approved) return "Pendente";
  return "Ativa";
};

const getUserStatusLabel = (item: User) => {
  if (item.blocked) return "Bloqueado";
  return "Ativo";
};

const canChangeUserRole = (item: User) => !item.companyId && item.role !== "partner";

export default function AdminPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("clubezn_admin_sidebar_open_v1");
    if (stored === null) return true;
    return stored === "1";
  });
  const [nowTimestamp, setNowTimestamp] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [actingOfferId, setActingOfferId] = useState<string | null>(null);
  const [actingUserId, setActingUserId] = useState<string | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRole>>({});
  const user = getCurrentUser();
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.replace("/auth");
      return;
    }
    if (currentUser.role !== "admin") {
      router.replace(routeByRole(currentUser.role));
      return;
    }
  }, [router]);

  useEffect(() => {
    const updateNow = () => setNowTimestamp(Date.now());
    updateNow();
    const timer = window.setInterval(updateNow, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("clubezn_admin_sidebar_open_v1", sidebarOpen ? "1" : "0");
  }, [sidebarOpen]);

  useEffect(() => {
    if (!data) return;
    setRoleDrafts((current) => {
      const next = { ...current };
      data.users.forEach((item) => {
        next[item.id] = current[item.id] ?? item.role;
      });
      return next;
    });
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    const userId = user?.id;

    const load = async () => {
      if (!userId) return;
      setLoadingData(true);

      if (!isSupabaseMode) {
        syncRedemptionExpirations();
        if (!cancelled) {
          setData(getData());
          setLoadingData(false);
        }
        return;
      }

      try {
        const response = await fetch("/api/admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            action: "getDashboardData",
          }),
        });

        const payload = (await response.json()) as { data?: AppData; error?: string };
        if (!response.ok || payload.error || !payload.data) {
          throw new Error(payload.error || "Falha ao carregar painel do administrador.");
        }

        if (!cancelled) {
          setData(payload.data);
        }
      } catch (error) {
        if (!cancelled) {
          setData(null);
          showToast(error instanceof Error ? error.message : "Falha ao carregar painel do administrador.", "error");
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [showToast, user?.id]);

  const reloadLocalData = () => {
    syncRedemptionExpirations();
    setData(getData());
  };

  const loadRemoteDashboard = async () => {
    const response = await fetch("/api/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        action: "getDashboardData",
      }),
    });

    const payload = (await response.json()) as { data?: AppData; error?: string };
    if (!response.ok || payload.error || !payload.data) {
      throw new Error(payload.error || "Falha ao carregar painel do administrador.");
    }

    setData(payload.data);
  };

  const handleOfferAction = async (action: "approveOffer" | "rejectOffer" | "deleteOffer", offer: Offer) => {
    const actionLabel =
      action === "approveOffer" ? "aprovar" : action === "rejectOffer" ? "rejeitar" : "excluir";

    if (action === "deleteOffer") {
      const confirmed = window.confirm(`Excluir a oferta "${offer.title}"? Esta ação remove a oferta do sistema.`);
      if (!confirmed) return;
    }

    setActingOfferId(offer.id);
    try {
      if (!isSupabaseMode) {
        if (action === "approveOffer") approveLocalOffer(offer.id);
        if (action === "rejectOffer") rejectLocalOffer(offer.id);
        if (action === "deleteOffer") deleteLocalOffer(offer.id);
        reloadLocalData();
      } else {
        const response = await fetch("/api/admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            action,
            offerId: offer.id,
          }),
        });

        const payload = (await response.json().catch(() => null)) as { data?: AppData; ok?: boolean; error?: string } | null;
        if (!response.ok || payload?.error) {
          throw new Error(payload?.error || `Falha ao ${actionLabel} oferta.`);
        }
        await loadRemoteDashboard();
      }

      showToast(`Oferta ${action === "approveOffer" ? "aprovada" : action === "rejectOffer" ? "rejeitada" : "excluída"} com sucesso.`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : `Falha ao ${actionLabel} oferta.`, "error");
    } finally {
      setActingOfferId(null);
    }
  };

  const handleCompanyApprove = async (company: Company) => {
    try {
      if (!isSupabaseMode) {
        approveLocalCompany(company.id);
        reloadLocalData();
      } else {
        const response = await fetch("/api/admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            action: "approveCompany",
            companyId: company.id,
          }),
        });

        const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
        if (!response.ok || payload?.error) {
          throw new Error(payload?.error || "Falha ao aprovar empresa.");
        }

        await loadRemoteDashboard();
      }

      showToast("Empresa aprovada com sucesso.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Falha ao aprovar empresa.", "error");
    }
  };

  const handleUserAction = async (
    action: "blockUser" | "unblockUser" | "deleteUser" | "updateUserRole",
    target: User,
    nextRole?: UserRole,
  ) => {
    const actionLabel =
      action === "blockUser"
        ? "bloquear"
        : action === "unblockUser"
          ? "desbloquear"
          : action === "deleteUser"
            ? "excluir"
            : "alterar papel de";

    if (action === "deleteUser") {
      const confirmed = window.confirm(`Excluir o usuário "${target.name}"? Esta ação remove também dados vinculados.`);
      if (!confirmed) return;
    }

    setActingUserId(target.id);
    try {
      if (!isSupabaseMode) {
        let result: { error?: string } = {};
        if (action === "blockUser") result = blockLocalUser(target.id);
        if (action === "unblockUser") result = unblockLocalUser(target.id);
        if (action === "deleteUser") result = deleteLocalUser(target.id);
        if (action === "updateUserRole" && nextRole) result = updateLocalUserRole(target.id, nextRole);
        if (result.error) throw new Error(result.error);
        reloadLocalData();
      } else {
        const response = await fetch("/api/admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(
            action === "updateUserRole"
              ? { action, userId: target.id, role: nextRole }
              : { action, userId: target.id },
          ),
        });

        const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
        if (!response.ok || payload?.error) {
          throw new Error(payload?.error || `Falha ao ${actionLabel} usuário.`);
        }

        await loadRemoteDashboard();
      }

      showToast(
        action === "blockUser"
          ? "Usuário bloqueado com sucesso."
          : action === "unblockUser"
            ? "Usuário desbloqueado com sucesso."
            : action === "deleteUser"
              ? "Usuário excluído com sucesso."
              : "Papel do usuário atualizado com sucesso.",
        "success",
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : `Falha ao ${actionLabel} usuário.`, "error");
    } finally {
      setActingUserId(null);
    }
  };

  const dashboard = useMemo(() => {
    if (!data) return null;

    const last7DaysStart = nowTimestamp - 7 * 24 * 60 * 60 * 1000;

    const pendingCompanies = sortByCreatedAtAsc(data.companies.filter((company) => !company.approved));
    const pendingOffers = sortByCreatedAtAsc(data.offers.filter((offer) => !offer.approved && !offer.rejected));
    const approvedCompanies = data.companies.filter((company) => company.approved).length;

    const redemptionsByStatus = {
      generated: data.redemptions.filter((item) => item.status === "generated").length,
      used: data.redemptions.filter((item) => item.status === "used").length,
      expired: data.redemptions.filter((item) => item.status === "expired").length,
    };

    const usedIn7Days = data.redemptions.filter(
      (item) => item.status === "used" && new Date(item.createdAt).getTime() >= last7DaysStart,
    ).length;

    const totalRedemptions = data.redemptions.length;
    const conversionRate = totalRedemptions > 0 ? Math.round((redemptionsByStatus.used / totalRedemptions) * 100) : 0;

    const usageByOffer = data.redemptions
      .filter((item) => item.status === "used")
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.offerId] = (acc[item.offerId] ?? 0) + 1;
        return acc;
      }, {});

    const topOffers = Object.entries(usageByOffer)
      .map(([offerId, total]) => ({
        offer: data.offers.find((offer) => offer.id === offerId),
        total,
      }))
      .filter((item) => item.offer)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const offerById = new Map(data.offers.map((offer) => [offer.id, offer]));
    const companyById = new Map(data.companies.map((company) => [company.id, company]));

    const redemptionActivity: ActivityItem[] = sortByCreatedAtDesc(data.redemptions)
      .slice(0, 10)
      .map((item: Redemption) => {
        const offer = offerById.get(item.offerId);
        const company = offer ? companyById.get(offer.companyId) : null;
        return {
          id: `r-${item.id}`,
          createdAt: item.createdAt,
          label: `Resgate ${item.status}`,
          detail: `${offer?.title ?? "Oferta removida"} • ${company?.name ?? "Parceiro"} • código ${item.code}`,
        };
      });

    const companyActivity: ActivityItem[] = sortByCreatedAtDesc(data.companies)
      .slice(0, 8)
      .map((company) => ({
        id: `c-${company.id}`,
        createdAt: company.createdAt,
        label: company.approved ? "Empresa aprovada" : "Nova empresa pendente",
        detail: `${company.name} • ${company.category} • ${company.neighborhood}`,
      }));

    const offerActivity: ActivityItem[] = sortByCreatedAtDesc(data.offers)
      .slice(0, 8)
      .map((offer) => {
        const company = companyById.get(offer.companyId);
        return {
          id: `o-${offer.id}`,
          createdAt: offer.createdAt,
          label: `Oferta ${getOfferStatusLabel(offer).toLowerCase()}`,
          detail: `${offer.title} • ${company?.name ?? "Parceiro"}`,
        };
      });

    const activity = [...redemptionActivity, ...companyActivity, ...offerActivity]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);

    return {
      pendingCompanies,
      pendingOffers,
      approvedCompanies,
      redemptionsByStatus,
      usedIn7Days,
      conversionRate,
      topOffers,
      activity,
      funnel: {
        companiesTotal: data.companies.length,
        companiesApproved: approvedCompanies,
        offersTotal: data.offers.length,
        offersApproved: data.offers.filter((offer) => offer.approved).length,
        redemptionsGenerated: redemptionsByStatus.generated,
        redemptionsUsed: redemptionsByStatus.used,
      },
    };
  }, [data, nowTimestamp]);

  if (!user || loadingData || !data || !dashboard) return <main className="clubezn-shell">Carregando...</main>;

  return (
    <main className="clubezn-shell grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start">
      <AdminDashboardSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        section={section}
        onSectionChange={(nextSection) => {
          setSection(nextSection);
          if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
            setSidebarOpen(false);
          }
        }}
        pendingCompanies={dashboard.pendingCompanies.length}
        pendingOffers={dashboard.pendingOffers.length}
        onLogout={() => {
          clearSession();
          router.push("/auth");
        }}
      />

      <div className="grid gap-4">
        {section === "dashboard" && (
          <>
            <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Empresas ativas" value={dashboard.approvedCompanies} helper="Empresas publicadas" />
              <MetricCard label="Empresas pendentes" value={dashboard.pendingCompanies.length} helper="Sem moderação automática" />
              <MetricCard label="Ofertas pendentes" value={dashboard.pendingOffers.length} helper="Sem moderação automática" />
              <MetricCard label="Resgates usados (7 dias)" value={dashboard.usedIn7Days} helper="Janela móvel semanal" />
            </section>

            <section className="grid gap-2.5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] xl:items-start">
              <article className="card grid gap-2">
                <h2 style={{ margin: 0, fontSize: 18 }}>Funil operacional</h2>
                <FunnelRow label="Empresas cadastradas" value={dashboard.funnel.companiesTotal} />
                <FunnelRow label="Empresas ativas" value={dashboard.funnel.companiesApproved} />
                <FunnelRow label="Ofertas cadastradas" value={dashboard.funnel.offersTotal} />
                <FunnelRow label="Ofertas ativas" value={dashboard.funnel.offersApproved} />
                <FunnelRow label="Códigos gerados" value={dashboard.funnel.redemptionsGenerated} />
                <FunnelRow label="Códigos usados" value={dashboard.funnel.redemptionsUsed} />
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                  Taxa de conversão geral de resgate: <strong>{dashboard.conversionRate}%</strong>
                </p>
              </article>

              <article className="card grid gap-2">
                <h2 style={{ margin: 0, fontSize: 18 }}>Status dos códigos</h2>
                <StatusLine label="Gerados" value={dashboard.redemptionsByStatus.generated} />
                <StatusLine label="Usados" value={dashboard.redemptionsByStatus.used} />
                <StatusLine label="Expirados" value={dashboard.redemptionsByStatus.expired} />
              </article>
            </section>

            <section className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
              <article className="card grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 style={{ margin: 0, fontSize: 18 }}>Top ofertas por uso</h2>
                  <button className="btn btn-ghost !w-auto !px-3 !py-1.5" onClick={() => setSection("offers")}>
                    Gerenciar ofertas
                  </button>
                </div>
                {dashboard.topOffers.map((item) => (
                  <div key={item.offer?.id} className="border-t pt-2" style={{ borderColor: "var(--line)" }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>{item.offer?.title}</p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>{item.total} resgate(s) confirmados</p>
                  </div>
                ))}
                {dashboard.topOffers.length === 0 && <p style={{ margin: 0 }}>Sem dados de resgate ainda.</p>}
              </article>

              <article className="card grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 style={{ margin: 0, fontSize: 18 }}>Resumo operacional</h2>
                  <button className="btn btn-ghost !w-auto !px-3 !py-1.5" onClick={() => setSection("companies")}>
                    Abrir empresas
                  </button>
                </div>
                {dashboard.pendingCompanies.slice(0, 3).map((company) => (
                  <div key={company.id} className="border-t pt-2" style={{ borderColor: "var(--line)" }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>{company.name}</p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      Criada há {getAgeLabel(company.createdAt)} • {company.category}
                    </p>
                  </div>
                ))}
                {dashboard.pendingOffers.slice(0, 3).map((offer) => (
                  <div key={offer.id} className="border-t pt-2" style={{ borderColor: "var(--line)" }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>{offer.title}</p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      Criada há {getAgeLabel(offer.createdAt)}
                    </p>
                  </div>
                ))}
                {dashboard.pendingCompanies.length === 0 && dashboard.pendingOffers.length === 0 && (
                  <p style={{ margin: 0 }}>Sem itens pendentes no momento.</p>
                )}
              </article>
            </section>

            <section className="card grid gap-2">
              <h2 style={{ margin: 0, fontSize: 18 }}>Atividade recente</h2>
              {dashboard.activity.map((item) => (
                <div key={item.id} className="border-t pt-2" style={{ borderColor: "var(--line)" }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: 13 }}>{item.detail}</p>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>{formatDate(item.createdAt)}</p>
                </div>
              ))}
              {dashboard.activity.length === 0 && <p style={{ margin: 0 }}>Sem atividade recente.</p>}
            </section>
          </>
        )}

        {section === "companies" && (
          <CompaniesList companies={sortByCreatedAtDesc(data.companies)} onApprove={handleCompanyApprove} />
        )}

        {section === "users" && (
          <UsersList
            users={sortByCreatedAtDesc(data.users)}
            currentAdminId={user.id}
            actingUserId={actingUserId}
            roleDrafts={roleDrafts}
            onRoleDraftChange={(userId, role) => setRoleDrafts((current) => ({ ...current, [userId]: role }))}
            onAction={handleUserAction}
          />
        )}

        {section === "offers" && (
          <OffersList
            offers={sortByCreatedAtDesc(data.offers)}
            companies={data.companies}
            actingOfferId={actingOfferId}
            onAction={handleOfferAction}
          />
        )}

        <footer className="card" style={{ fontSize: 12, color: "var(--muted)" }}>
          <p style={{ margin: 0 }}>ClubeZN - Administração</p>
        </footer>
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

function FunnelRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-t py-2" style={{ borderColor: "var(--line)" }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-t py-2" style={{ borderColor: "var(--line)" }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      <span className="badge badge-ok">{value}</span>
    </div>
  );
}

function CompaniesList({
  companies,
  onApprove,
}: {
  companies: Company[];
  onApprove: (company: Company) => Promise<void>;
}) {
  return (
    <section className="card grid gap-2">
      <h2 style={{ margin: 0, fontSize: 18 }}>Empresas cadastradas</h2>
      {companies.map((company) => (
        <article key={company.id} className="grid gap-2 border-t pt-2" style={{ borderColor: "var(--line)" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>{company.name}</p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            {company.category} • {company.neighborhood} • {company.city}/{company.state}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
            Criada em {formatDate(company.createdAt)} • {company.approved ? "Ativa" : "Inativa"}
          </p>
          {!company.approved && (
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-ghost !w-auto !px-3 !py-1.5" onClick={() => void onApprove(company)}>
                Aprovar empresa
              </button>
            </div>
          )}
        </article>
      ))}
      {companies.length === 0 && <p style={{ margin: 0 }}>Nenhuma empresa cadastrada.</p>}
    </section>
  );
}

function UsersList({
  users,
  currentAdminId,
  actingUserId,
  roleDrafts,
  onRoleDraftChange,
  onAction,
}: {
  users: User[];
  currentAdminId: string;
  actingUserId: string | null;
  roleDrafts: Record<string, UserRole>;
  onRoleDraftChange: (userId: string, role: UserRole) => void;
  onAction: (action: "blockUser" | "unblockUser" | "deleteUser" | "updateUserRole", target: User, nextRole?: UserRole) => Promise<void>;
}) {
  return (
    <section className="card grid gap-2">
      <h2 style={{ margin: 0, fontSize: 18 }}>Usuários cadastrados</h2>
      {users.map((item) => {
        const busy = actingUserId === item.id;
        const isSelf = item.id === currentAdminId;
        const roleDraft = roleDrafts[item.id] ?? item.role;
        return (
          <article key={item.id} className="grid gap-2 border-t pt-2" style={{ borderColor: "var(--line)" }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p style={{ margin: 0, fontWeight: 700 }}>{item.name}</p>
              <span className={item.blocked ? "badge badge-danger" : "badge badge-ok"}>{getUserStatusLabel(item)}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              {item.email ?? item.phone ?? "Sem identificador"} • papel {item.role}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
              Criado em {formatDate(item.createdAt)}{item.companyId ? " • vinculado a empresa" : ""}{isSelf ? " • sua conta atual" : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {!item.blocked ? (
                <button className="btn btn-ghost !w-auto !px-3 !py-1.5" onClick={() => void onAction("blockUser", item)} disabled={busy || isSelf}>
                  Bloquear
                </button>
              ) : (
                <button className="btn btn-ghost !w-auto !px-3 !py-1.5" onClick={() => void onAction("unblockUser", item)} disabled={busy}>
                  Desbloquear
                </button>
              )}
              <button className="btn btn-ghost !w-auto !px-3 !py-1.5" onClick={() => void onAction("deleteUser", item)} disabled={busy || isSelf}>
                Excluir
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={roleDraft} onChange={(event) => onRoleDraftChange(item.id, event.target.value as UserRole)} disabled={busy || isSelf || !canChangeUserRole(item)}>
                <option value="consumer">consumer</option>
                <option value="admin">admin</option>
                <option value="partner">partner</option>
              </select>
              <button
                className="btn btn-ghost !w-auto !px-3 !py-1.5"
                onClick={() => void onAction("updateUserRole", item, roleDraft)}
                disabled={busy || isSelf || !canChangeUserRole(item) || roleDraft === item.role}
              >
                Salvar papel
              </button>
            </div>
            {!canChangeUserRole(item) && (
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                Alteração de papel para parceiro ou usuário vinculado a empresa exige fluxo dedicado.
              </p>
            )}
          </article>
        );
      })}
      {users.length === 0 && <p style={{ margin: 0 }}>Nenhum usuário cadastrado.</p>}
    </section>
  );
}

function OffersList({
  offers,
  companies,
  actingOfferId,
  onAction,
}: {
  offers: Offer[];
  companies: Company[];
  actingOfferId: string | null;
  onAction: (action: "approveOffer" | "rejectOffer" | "deleteOffer", offer: Offer) => Promise<void>;
}) {
  const companyById = new Map(companies.map((company) => [company.id, company]));
  return (
    <section className="card grid gap-2">
      <h2 style={{ margin: 0, fontSize: 18 }}>Ofertas cadastradas</h2>
      {offers.map((offer) => {
        const company = companyById.get(offer.companyId);
        const busy = actingOfferId === offer.id;
        return (
          <article key={offer.id} className="grid gap-2 border-t pt-2" style={{ borderColor: "var(--line)" }}>
            <p style={{ margin: 0, fontWeight: 700 }}>{offer.title}</p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              {offer.discountLabel} • {company?.name} • {offer.neighborhood}
            </p>
            <p style={{ margin: 0, fontSize: 13 }}>{offer.description}</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
              Criada em {formatDate(offer.createdAt)} • {getOfferStatusLabel(offer)}
            </p>
            <div className="flex flex-wrap gap-2">
              {!offer.approved && (
                <button className="btn btn-ghost !w-auto !px-3 !py-1.5" onClick={() => void onAction("approveOffer", offer)} disabled={busy}>
                  Aprovar
                </button>
              )}
              {!offer.rejected && (
                <button className="btn btn-ghost !w-auto !px-3 !py-1.5" onClick={() => void onAction("rejectOffer", offer)} disabled={busy}>
                  Rejeitar
                </button>
              )}
              <button className="btn btn-ghost !w-auto !px-3 !py-1.5" onClick={() => void onAction("deleteOffer", offer)} disabled={busy}>
                Excluir
              </button>
            </div>
          </article>
        );
      })}
      {offers.length === 0 && <p style={{ margin: 0 }}>Nenhuma oferta cadastrada.</p>}
    </section>
  );
}
