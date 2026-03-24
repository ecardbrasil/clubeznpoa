"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { OfferCard } from "@/components/offer-card";
import { useToast } from "@/components/ui/toast";
import { isSupabaseMode } from "@/lib/runtime-config";
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
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const user = getCurrentUser();
  const [supabaseModeData, setSupabaseModeData] = useState<{
    offers: Offer[];
    companiesById: Map<string, AppData["companies"][number]>;
    redemptions: Redemption[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<AppData | null>(() => {
    syncRedemptionExpirations();
    return getData();
  });

  const refresh = () => {
    if (isSupabaseMode) return;
    syncRedemptionExpirations();
    setData(getData());
  };

  const fetchConsumerDataFromSupabase = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/consumer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getData",
          userId: user.id,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        offers?: Array<{
          id: string;
          company_id: string;
          title: string;
          description: string;
          discount_label: string;
          category: string;
          neighborhood: string;
          images: string[] | null;
          approved: boolean;
          rejected: boolean;
          created_at: string;
        }>;
        companies?: Array<{
          id: string;
          name: string;
          public_name: string | null;
          category: string;
          neighborhood: string;
          city: string;
          state: string;
          owner_user_id: string;
          approved: boolean;
          logo_image: string | null;
          cover_image: string | null;
          address_line: string | null;
          bio: string | null;
          instagram: string | null;
          facebook: string | null;
          website: string | null;
          whatsapp: string | null;
          created_at: string;
        }>;
        redemptions?: Array<{
          id: string;
          user_id: string;
          offer_id: string;
          code: string;
          status: "generated" | "used" | "expired";
          created_at: string;
          expires_at: string;
          used_at: string | null;
        }>;
      };

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Falha ao carregar dados do consumidor.");
      }

      const offers: Offer[] = (payload.offers ?? []).map((offer) => ({
        id: offer.id,
        companyId: offer.company_id,
        title: offer.title,
        description: offer.description,
        discountLabel: offer.discount_label,
        category: offer.category,
        neighborhood: offer.neighborhood,
        images: Array.isArray(offer.images) ? offer.images : [],
        approved: offer.approved,
        rejected: offer.rejected,
        createdAt: offer.created_at,
      }));

      const companies = (payload.companies ?? []).map((company) => ({
        id: company.id,
        name: company.name,
        publicName: company.public_name ?? undefined,
        category: company.category,
        neighborhood: company.neighborhood,
        city: company.city,
        state: company.state,
        ownerUserId: company.owner_user_id,
        approved: company.approved,
        logoImage: company.logo_image ?? undefined,
        coverImage: company.cover_image ?? undefined,
        addressLine: company.address_line ?? undefined,
        bio: company.bio ?? undefined,
        instagram: company.instagram ?? undefined,
        facebook: company.facebook ?? undefined,
        website: company.website ?? undefined,
        whatsapp: company.whatsapp ?? undefined,
        createdAt: company.created_at,
      }));

      const redemptions: Redemption[] = (payload.redemptions ?? []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        offerId: item.offer_id,
        code: item.code,
        status: item.status,
        createdAt: item.created_at,
        expiresAt: item.expires_at,
        usedAt: item.used_at ?? undefined,
      }));

      setSupabaseModeData({
        offers,
        companiesById: new Map(companies.map((company) => [company.id, company])),
        redemptions,
      });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Falha ao carregar dados do consumidor.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast, user]);

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

  useEffect(() => {
    if (!user) return;
    if (!isSupabaseMode) return;
    fetchConsumerDataFromSupabase();
  }, [fetchConsumerDataFromSupabase, user]);

  const activeCode = useMemo<Redemption | null>(() => {
    if (!user) return null;
    if (isSupabaseMode) {
      return (
        (supabaseModeData?.redemptions ?? [])
          .filter((r) => r.userId === user.id && r.status === "generated")
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null
      );
    }
    if (!data) return null;
    return (
      data.redemptions
        .filter((r) => r.userId === user.id && r.status === "generated")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null
    );
  }, [data, supabaseModeData, user]);

  const availableOffers = useMemo(() => {
    if (isSupabaseMode) {
      if (!supabaseModeData) return [];
      return supabaseModeData.offers
        .filter((offer) => !offer.rejected);
    }
    if (!data) return [];
    return data.offers
      .filter((offer) => !offer.rejected);
  }, [data, supabaseModeData]);

  const filteredOffers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return availableOffers;
    return availableOffers.filter((offer) =>
      [offer.title, offer.description, offer.category, offer.neighborhood].some((item) =>
        item.toLowerCase().includes(q),
      ),
    );
  }, [availableOffers, search]);

  const hotOfferIds = useMemo(() => {
    if (isSupabaseMode) {
      if (!supabaseModeData) return new Set<string>();
      return getHotOfferIds(
        {
          offers: supabaseModeData.offers,
          redemptions: supabaseModeData.redemptions,
        },
        4,
      );
    }
    if (!data) return new Set<string>();
    return getHotOfferIds(data, 4);
  }, [data, supabaseModeData]);

  const generateCode = async (offer: Offer) => {
    if (!user) return;
    if (isSupabaseMode) {
      try {
        const response = await fetch("/api/consumer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generateCode",
            userId: user.id,
            offerId: offer.id,
          }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok || payload.error) {
          throw new Error(payload.error || "Falha ao gerar código de resgate.");
        }
        showToast("Código de resgate gerado com sucesso.", "success");
        await fetchConsumerDataFromSupabase();
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Falha ao gerar código de resgate.", "error");
      }
      return;
    }
    generateRedemption(user.id, offer.id);
    showToast("Código de resgate gerado com sucesso.", "success");
    refresh();
  };

  if (!user || (!isSupabaseMode && !data)) {
    return <main className="clubezn-shell">Carregando...</main>;
  }

  const companiesById = isSupabaseMode
    ? (supabaseModeData?.companiesById ?? new Map())
    : new Map(data?.companies.map((company) => [company.id, company]));
  const offersById = new Map((isSupabaseMode ? supabaseModeData?.offers ?? [] : data?.offers ?? []).map((offer) => [offer.id, offer]));
  const history = isSupabaseMode
    ? (supabaseModeData?.redemptions ?? [])
        .filter((redemption) => redemption.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : (data?.redemptions ?? [])
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
        {isSupabaseMode && isLoading ? (
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>Sincronizando dados do Supabase...</p>
        ) : null}
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
            const offer = offersById.get(item.offerId);
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
