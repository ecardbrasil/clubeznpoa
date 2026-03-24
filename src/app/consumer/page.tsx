"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { OfferCard } from "@/components/offer-card";
import { AppData, Offer, Redemption } from "@/lib/types";
import {
  clearSession,
  generateRedemption,
  getCurrentUser,
  getData,
  routeByRole,
  syncRedemptionExpirations,
} from "@/lib/storage";
import { getHotOfferIds } from "@/lib/utils";

const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
};

export default function ConsumerPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
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
    if (currentUser.role !== "consumer") {
      router.replace(routeByRole(currentUser.role));
      return;
    }

  }, [router]);

  const activeCode = useMemo<Redemption | null>(() => {
    if (!data || !user) return null;
    return (
      data.redemptions
        .filter((r) => r.userId === user.id && r.status === "generated")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null
    );
  }, [data, user]);

  const approvedOffers = useMemo(() => {
    if (!data) return [];
    const companiesById = new Map(data.companies.map((c) => [c.id, c]));
    return data.offers
      .filter((offer) => offer.approved)
      .filter((offer) => {
        const company = companiesById.get(offer.companyId);
        return company?.approved;
      });
  }, [data]);

  const filteredOffers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return approvedOffers;
    return approvedOffers.filter((offer) =>
      [offer.title, offer.description, offer.category, offer.neighborhood].some((item) =>
        item.toLowerCase().includes(q),
      ),
    );
  }, [approvedOffers, search]);

  const hotOfferIds = useMemo(() => {
    if (!data) return new Set<string>();
    return getHotOfferIds(data, 4);
  }, [data]);

  const generateCode = (offer: Offer) => {
    if (!user) return;
    generateRedemption(user.id, offer.id);
    refresh();
  };

  if (!user || !data) {
    return <main className="clubezn-shell">Carregando...</main>;
  }

  const companiesById = new Map(data.companies.map((company) => [company.id, company]));
  const history = data.redemptions
    .filter((redemption) => redemption.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <main className="clubezn-shell grid gap-4">
      <section className="card grid gap-2">
        <BrandLogo small />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Consumidor</p>
            <h1 style={{ margin: "2px 0 0", fontSize: 23 }}>Olá, {user.name}</h1>
          </div>
          <button
            className="btn btn-ghost"
            style={{ width: "auto", padding: "8px 12px" }}
            onClick={() => {
              clearSession();
              router.push("/auth");
            }}
          >
            Sair
          </button>
        </div>
        <input
          placeholder="Buscar por oferta, bairro ou categoria"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px" }}
        />
      </section>

      {activeCode && (
        <section className="card grid gap-1.5" style={{ borderColor: "#b7dfd4" }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Seu código ativo (10 min)</p>
          <p style={{ margin: 0, fontSize: 34, letterSpacing: 4, fontWeight: 800 }}>{activeCode.code}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
            Expira em: {formatDate(activeCode.expiresAt)}
          </p>
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] xl:items-start">
        <section className="grid gap-2.5">
          <h2 style={{ margin: 0, fontSize: 18 }}>Ofertas da Zona Norte</h2>
          {filteredOffers.map((offer) => {
            const company = companiesById.get(offer.companyId);
            return (
              <OfferCard
                key={offer.id}
                actionLabel="Gerar código de resgate"
                onAction={() => generateCode(offer)}
                secondaryLabel="Ver detalhes da oferta"
                offer={{
                  ...offer,
                  companyId: offer.companyId,
                  isHot: hotOfferIds.has(offer.id),
                  companyName: company?.publicName ?? company?.name ?? "Parceiro ClubeZN",
                  partnerLogoImage: company?.logoImage,
                  partnerCoverImage: company?.coverImage,
                  partnerAddressLine: company?.addressLine,
                  partnerInstagram: company?.instagram,
                  partnerFacebook: company?.facebook,
                  partnerWebsite: company?.website,
                  partnerWhatsapp: company?.whatsapp,
                }}
              />
            );
          })}
          {filteredOffers.length === 0 && <p style={{ margin: 0 }}>Nenhuma oferta encontrada.</p>}
        </section>

        <section className="card grid gap-2">
          <h2 style={{ margin: 0, fontSize: 18 }}>Histórico de resgates</h2>
          {history.slice(0, 8).map((item) => {
            const offer = data.offers.find((offerItem) => offerItem.id === item.offerId);
            return (
              <div key={item.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                <p style={{ margin: 0, fontWeight: 700 }}>{offer?.title ?? "Oferta removida"}</p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                  Código {item.code} • {item.status} • {formatDate(item.createdAt)}
                </p>
              </div>
            );
          })}
          {history.length === 0 && <p style={{ margin: 0 }}>Você ainda não gerou nenhum resgate.</p>}
        </section>
      </div>

      <footer className="card" style={{ fontSize: 12, color: "var(--muted)" }}>
        <p style={{ margin: 0 }}>ClubeZN - Consumidor</p>
      </footer>
    </main>
  );
}
