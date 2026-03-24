"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboardSidebar, AdminSection } from "@/components/admin/dashboard-sidebar";
import { useToast } from "@/components/ui/toast";
import { AppData, Company, Offer, Redemption } from "@/lib/types";
import {
  approveCompany,
  approveOffer,
  clearSession,
  getCurrentUser,
  getData,
  rejectOffer,
  routeByRole,
  syncRedemptionExpirations,
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
  const user = getCurrentUser();
  const [data, setData] = useState<AppData | null>(() => {
    syncRedemptionExpirations();
    return getData();
  });

  const refresh = () => {
    syncRedemptionExpirations();
    setData(getData());
  };

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
          label: offer.approved ? "Oferta aprovada" : "Nova oferta pendente",
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

  if (!user || !data || !dashboard) return <main className="clubezn-shell">Carregando...</main>;

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
              <MetricCard label="Empresas ativas" value={dashboard.approvedCompanies} helper="Aprovadas pelo admin" />
              <MetricCard label="Empresas pendentes" value={dashboard.pendingCompanies.length} helper="Aguardando aprovação" />
              <MetricCard label="Ofertas pendentes" value={dashboard.pendingOffers.length} helper="Fila de moderação" />
              <MetricCard label="Resgates usados (7 dias)" value={dashboard.usedIn7Days} helper="Janela móvel semanal" />
            </section>

            <section className="grid gap-2.5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] xl:items-start">
              <article className="card grid gap-2">
                <h2 style={{ margin: 0, fontSize: 18 }}>Funil operacional</h2>
                <FunnelRow label="Empresas cadastradas" value={dashboard.funnel.companiesTotal} />
                <FunnelRow label="Empresas aprovadas" value={dashboard.funnel.companiesApproved} />
                <FunnelRow label="Ofertas cadastradas" value={dashboard.funnel.offersTotal} />
                <FunnelRow label="Ofertas aprovadas" value={dashboard.funnel.offersApproved} />
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
                  <h2 style={{ margin: 0, fontSize: 18 }}>Fila prioritária</h2>
                  <button className="btn btn-ghost !w-auto !px-3 !py-1.5" onClick={() => setSection("companies")}>
                    Abrir empresas
                  </button>
                </div>
                {dashboard.pendingCompanies.slice(0, 3).map((company) => (
                  <div key={company.id} className="border-t pt-2" style={{ borderColor: "var(--line)" }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>{company.name}</p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      Pendente há {getAgeLabel(company.createdAt)} • {company.category}
                    </p>
                  </div>
                ))}
                {dashboard.pendingOffers.slice(0, 3).map((offer) => (
                  <div key={offer.id} className="border-t pt-2" style={{ borderColor: "var(--line)" }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>{offer.title}</p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      Oferta pendente há {getAgeLabel(offer.createdAt)}
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
          <ApprovalCompanies
            pendingCompanies={dashboard.pendingCompanies}
            onApprove={(companyId) => {
              approveCompany(companyId);
              refresh();
              showToast("Empresa aprovada com sucesso.", "success");
            }}
          />
        )}

        {section === "offers" && (
          <ApprovalOffers
            pendingOffers={dashboard.pendingOffers}
            companies={data.companies}
            onApprove={(offerId) => {
              approveOffer(offerId);
              refresh();
              showToast("Oferta aprovada com sucesso.", "success");
            }}
            onReject={(offerId) => {
              rejectOffer(offerId);
              refresh();
              showToast("Oferta rejeitada com sucesso.", "info");
            }}
          />
        )}

        <footer className="card" style={{ fontSize: 12, color: "var(--muted)" }}>
          <p style={{ margin: 0 }}>ClubeZN - Administracao</p>
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

function ApprovalCompanies({
  pendingCompanies,
  onApprove,
}: {
  pendingCompanies: Company[];
  onApprove: (companyId: string) => void;
}) {
  return (
    <section className="card grid gap-2">
      <h2 style={{ margin: 0, fontSize: 18 }}>Empresas pendentes</h2>
      {pendingCompanies.map((company) => (
        <article key={company.id} className="grid gap-2 border-t pt-2" style={{ borderColor: "var(--line)" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>{company.name}</p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            {company.category} • {company.neighborhood} • {company.city}/{company.state}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Criada em {formatDate(company.createdAt)}</p>
          <button className="btn btn-primary md:!w-auto" onClick={() => onApprove(company.id)}>
            Aprovar empresa
          </button>
        </article>
      ))}
      {pendingCompanies.length === 0 && <p style={{ margin: 0 }}>Nenhuma empresa aguardando aprovação.</p>}
    </section>
  );
}

function ApprovalOffers({
  pendingOffers,
  companies,
  onApprove,
  onReject,
}: {
  pendingOffers: Offer[];
  companies: Company[];
  onApprove: (offerId: string) => void;
  onReject: (offerId: string) => void;
}) {
  const companyById = new Map(companies.map((company) => [company.id, company]));
  return (
    <section className="card grid gap-2">
      <h2 style={{ margin: 0, fontSize: 18 }}>Ofertas pendentes</h2>
      {pendingOffers.map((offer) => {
        const company = companyById.get(offer.companyId);
        return (
          <article key={offer.id} className="grid gap-2 border-t pt-2" style={{ borderColor: "var(--line)" }}>
            <p style={{ margin: 0, fontWeight: 700 }}>{offer.title}</p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              {offer.discountLabel} • {company?.name} • {offer.neighborhood}
            </p>
            <p style={{ margin: 0, fontSize: 13 }}>{offer.description}</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Criada em {formatDate(offer.createdAt)}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button className="btn btn-primary md:!w-auto" onClick={() => onApprove(offer.id)}>
                Aprovar oferta
              </button>
              <button className="btn btn-ghost md:!w-auto" onClick={() => onReject(offer.id)}>
                Rejeitar oferta
              </button>
            </div>
          </article>
        );
      })}
      {pendingOffers.length === 0 && <p style={{ margin: 0 }}>Nenhuma oferta aguardando aprovação.</p>}
    </section>
  );
}
