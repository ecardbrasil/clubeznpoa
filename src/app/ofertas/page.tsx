"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { OfferCard, type OfferCardData } from "@/components/offer-card";
import { PublicPageHeader } from "@/components/public-page-header";
import { useToast } from "@/components/ui/toast";
import { isSupabaseMode } from "@/lib/runtime-config";
import { clearSession, generateRedemption, getCurrentUser, getData, initStorage, routeByRole } from "@/lib/storage";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { User } from "@/lib/types";
import { getHotOfferIds } from "@/lib/utils";

type SortOption = "recentes" | "desconto" | "bairro";

type PublicOffer = OfferCardData & {
  companyId: string;
  createdAt: string;
};

type SupabaseOfferRow = {
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
};

type SupabaseCompanyRow = {
  id: string;
  name: string;
  public_name: string | null;
  approved: boolean;
  logo_image: string | null;
  cover_image: string | null;
  address_line: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  whatsapp: string | null;
};

const mapLocalOffers = (): PublicOffer[] => {
  initStorage();
  const data = getData();
  const hotOfferIds = getHotOfferIds(data, 4);
  const companiesById = new Map(data.companies.map((company) => [company.id, company]));

  return data.offers
    .filter((offer) => !offer.rejected && companiesById.has(offer.companyId))
    .map((offer) => {
      const company = companiesById.get(offer.companyId);
      return {
        id: offer.id,
        companyId: offer.companyId,
        createdAt: offer.createdAt,
        title: offer.title,
        description: offer.description,
        discountLabel: offer.discountLabel,
        isHot: hotOfferIds.has(offer.id),
        category: offer.category,
        neighborhood: offer.neighborhood,
        images: offer.images,
        companyName: company?.publicName ?? company?.name ?? "Parceiro ClubeZN",
        partnerLogoImage: company?.logoImage,
        partnerCoverImage: company?.coverImage,
        partnerAddressLine: company?.addressLine,
        partnerInstagram: company?.instagram,
        partnerFacebook: company?.facebook,
        partnerWebsite: company?.website,
        partnerWhatsapp: company?.whatsapp,
      };
    });
};

const mapSupabaseOffers = async (): Promise<PublicOffer[]> => {
  if (!hasSupabaseEnv()) {
    throw new Error("Variáveis do Supabase não configuradas.");
  }

  const supabase = getSupabaseBrowserClient();

  const [offersRes, companiesRes, redemptionsRes] = await Promise.all([
    supabase
      .from("offers")
      .select("id, company_id, title, description, discount_label, category, neighborhood, images, approved, rejected, created_at"),
    supabase
      .from("companies")
      .select("id, name, public_name, approved, logo_image, cover_image, address_line, instagram, facebook, website, whatsapp"),
    supabase.from("redemptions").select("offer_id, status"),
  ]);

  if (offersRes.error) throw offersRes.error;
  if (companiesRes.error) throw companiesRes.error;
  if (redemptionsRes.error) throw redemptionsRes.error;

  const offers = (offersRes.data ?? []) as SupabaseOfferRow[];
  const companies = (companiesRes.data ?? []) as SupabaseCompanyRow[];
  const redemptions = (redemptionsRes.data ?? []) as Array<{ offer_id: string; status: "generated" | "used" | "expired" }>;

  const companiesById = new Map(companies.map((company) => [company.id, company]));

  const usageScoreByOffer = redemptions.reduce<Record<string, number>>((acc, redemption) => {
    const score = redemption.status === "used" ? 2 : redemption.status === "generated" ? 1 : 0;
    if (score <= 0) return acc;
    acc[redemption.offer_id] = (acc[redemption.offer_id] ?? 0) + score;
    return acc;
  }, {});

  const hotOfferIds = new Set(
    Object.entries(usageScoreByOffer)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .filter(([, score]) => score > 0)
      .map(([offerId]) => offerId),
  );

  return offers
    .filter((offer) => !offer.rejected && companiesById.has(offer.company_id))
    .map((offer) => {
      const company = companiesById.get(offer.company_id);
      return {
        id: offer.id,
        companyId: offer.company_id,
        createdAt: offer.created_at,
        title: offer.title,
        description: offer.description,
        discountLabel: offer.discount_label,
        isHot: hotOfferIds.has(offer.id),
        category: offer.category,
        neighborhood: offer.neighborhood,
        images: Array.isArray(offer.images) ? offer.images : [],
        companyName: company?.public_name ?? company?.name ?? "Parceiro ClubeZN",
        partnerLogoImage: company?.logo_image ?? undefined,
        partnerCoverImage: company?.cover_image ?? undefined,
        partnerAddressLine: company?.address_line ?? undefined,
        partnerInstagram: company?.instagram ?? undefined,
        partnerFacebook: company?.facebook ?? undefined,
        partnerWebsite: company?.website ?? undefined,
        partnerWhatsapp: company?.whatsapp ?? undefined,
      };
    });
};

function OffersPageContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [allOffers, setAllOffers] = useState<PublicOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  const [viewer, setViewer] = useState<User | null>(null);

  useEffect(() => {
    setViewer(getCurrentUser());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setLoadingError("");

        const mapped = isSupabaseMode ? await mapSupabaseOffers() : mapLocalOffers();
        if (!cancelled) {
          setAllOffers(mapped);
        }
      } catch (error) {
        if (!cancelled) {
          setAllOffers([]);
          setLoadingError(error instanceof Error ? error.message : "Falha ao carregar ofertas.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("recentes");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(allOffers.map((offer) => offer.category))).sort((a, b) => a.localeCompare(b, "pt-BR"))],
    [allOffers],
  );
  const neighborhoods = useMemo(
    () => [
      "all",
      ...Array.from(new Set(allOffers.map((offer) => offer.neighborhood))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    ],
    [allOffers],
  );
  const partners = useMemo(
    () => [
      "all",
      ...Array.from(new Set(allOffers.map((offer) => offer.companyName))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    ],
    [allOffers],
  );

  const selectedNeighborhoodFromUrl = useMemo(() => {
    const bairroParam = searchParams.get("bairro");
    if (!bairroParam) return "all";

    const matchedNeighborhood = neighborhoods.find((item) => item.toLowerCase() === bairroParam.toLowerCase());
    return matchedNeighborhood ?? "all";
  }, [neighborhoods, searchParams]);

  const selectedCategoryFromUrl = useMemo(() => {
    const categoriaParam = searchParams.get("categoria");
    if (!categoriaParam) return "all";

    const matchedCategory = categories.find((item) => item.toLowerCase() === categoriaParam.toLowerCase());
    return matchedCategory ?? "all";
  }, [categories, searchParams]);

  const filteredOffers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const effectiveNeighborhood = selectedNeighborhood !== "all" ? selectedNeighborhood : selectedNeighborhoodFromUrl;
    const effectiveCategory = selectedCategory !== "all" ? selectedCategory : selectedCategoryFromUrl;

    let output = allOffers.filter((offer) => {
      if (effectiveCategory !== "all" && offer.category !== effectiveCategory) return false;
      if (effectiveNeighborhood !== "all" && offer.neighborhood !== effectiveNeighborhood) return false;
      if (selectedPartner !== "all" && offer.companyName !== selectedPartner) return false;
      if (!normalizedQuery) return true;

      return [offer.title, offer.description, offer.companyName, offer.category, offer.neighborhood]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });

    output = [...output].sort((a, b) => {
      if (sortBy === "desconto") return b.discountLabel.localeCompare(a.discountLabel, "pt-BR");
      if (sortBy === "bairro") return a.neighborhood.localeCompare(b.neighborhood, "pt-BR");
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return output;
  }, [
    allOffers,
    query,
    selectedCategory,
    selectedCategoryFromUrl,
    selectedNeighborhood,
    selectedNeighborhoodFromUrl,
    selectedPartner,
    sortBy,
  ]);

  const resetFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setSelectedNeighborhood("all");
    setSelectedPartner("all");
    setSortBy("recentes");
  };

  const handleGenerateCode = async (offerId: string) => {
    if (!viewer || viewer.role !== "consumer") return;

    try {
      if (isSupabaseMode) {
        const response = await fetch("/api/consumer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generateCode",
            userId: viewer.id,
            offerId,
          }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok || payload.error) {
          throw new Error(payload.error || "Falha ao gerar código de resgate.");
        }
      } else {
        generateRedemption(viewer.id, offerId);
      }

      showToast("Código de resgate gerado com sucesso.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Falha ao gerar código de resgate.", "error");
    }
  };

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1400px] gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-6 xl:px-8">
      <PublicPageHeader
        subtitle={viewer?.role === "consumer" ? "Vitrine de ofertas - cliente logado" : "Vitrine pública de ofertas"}
        actions={
          <>
            <Link href="/" className="btn btn-ghost !w-auto !px-4 !py-2 text-sm">
              Voltar para a home
            </Link>
            {viewer?.role === "consumer" ? (
              <>
                <span className="badge badge-ok">Olá, {viewer.name}</span>
                <button
                  className="btn btn-ghost !w-auto !px-4 !py-2 text-sm"
                  onClick={() => {
                    clearSession();
                    setViewer(null);
                    router.push("/auth");
                  }}
                  type="button"
                >
                  Sair
                </button>
              </>
            ) : viewer ? (
              <>
                <button
                  className="btn btn-ghost !w-auto !px-4 !py-2 text-sm"
                  onClick={() => router.push(routeByRole(viewer.role))}
                  type="button"
                >
                  Ir para painel
                </button>
                <button
                  className="btn btn-ghost !w-auto !px-4 !py-2 text-sm"
                  onClick={() => {
                    clearSession();
                    setViewer(null);
                    router.push("/auth");
                  }}
                  type="button"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link href="/auth" className="btn btn-primary !w-auto !px-4 !py-2 text-sm">
                Começar pelo cadastro
              </Link>
            )}
          </>
        }
      />

      <section className="grid gap-2 rounded-2xl border border-[#d1dfd1] bg-white p-4 md:p-5">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#2b7a3f]">Ofertas abertas</p>
        <h1 className="m-0 text-3xl font-black leading-tight text-[#102113] md:text-4xl">Escolha por bairro, categoria e parceiro.</h1>
        <p className="m-0 max-w-3xl text-sm text-[#486048] md:text-base">
          Explore os benefícios da Zona Norte com filtros completos para encontrar a melhor oferta para o seu dia.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <aside className="grid gap-3 rounded-2xl border border-[#d1dfd1] bg-white p-3 md:sticky md:top-6">
          <h2 className="m-0 text-base font-extrabold text-[#102113]">Filtrar ofertas</h2>

          <label className="field">
            <span>Busca por termo</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Oferta, parceiro, bairro..."
            />
          </label>

          <label className="field">
            <span>Categoria</span>
            <select
              value={selectedCategory !== "all" ? selectedCategory : selectedCategoryFromUrl}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "Todas as categorias" : category}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Bairro</span>
            <select
              value={selectedNeighborhood !== "all" ? selectedNeighborhood : selectedNeighborhoodFromUrl}
              onChange={(event) => setSelectedNeighborhood(event.target.value)}
            >
              {neighborhoods.map((neighborhood) => (
                <option key={neighborhood} value={neighborhood}>
                  {neighborhood === "all" ? "Todos os bairros" : neighborhood}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Parceiro</span>
            <select value={selectedPartner} onChange={(event) => setSelectedPartner(event.target.value)}>
              {partners.map((partner) => (
                <option key={partner} value={partner}>
                  {partner === "all" ? "Todos os parceiros" : partner}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Ordenar por</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)}>
              <option value="recentes">Mais recentes</option>
              <option value="desconto">Maior destaque de desconto</option>
              <option value="bairro">Bairro (A-Z)</option>
            </select>
          </label>

          <button type="button" className="btn btn-ghost" onClick={resetFilters}>
            Limpar filtros
          </button>
        </aside>

        <section className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#d1dfd1] bg-white px-3 py-2.5">
            <p className="m-0 text-sm font-semibold text-[#1f5f30]">
              {loading ? "Carregando ofertas..." : `${filteredOffers.length} oferta(s) encontrada(s) com os filtros atuais`}
            </p>
            {viewer?.role === "consumer" ? (
              <span className="text-sm font-semibold text-[#1f5f30]">Você está logado e já pode resgatar códigos.</span>
            ) : (
              <Link href="/auth" className="text-sm font-bold text-[#1f5f30] hover:underline">
                Quero acessar com login
              </Link>
            )}
          </div>

          {loadingError ? (
            <article className="rounded-2xl border border-[#f0c8c8] bg-[#fff2f2] px-3 py-2 text-sm text-[#7c2323]">
              Não foi possível carregar as ofertas do Supabase. Detalhe: {loadingError}
            </article>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                actionHref={viewer?.role === "consumer" ? undefined : "/auth"}
                actionLabel={viewer?.role === "consumer" ? "Gerar código de resgate" : "Quero essa oferta"}
                onAction={viewer?.role === "consumer" ? () => handleGenerateCode(offer.id) : undefined}
                offer={offer}
              />
            ))}
          </div>

          {filteredOffers.length === 0 && (
            <article className="grid gap-2 rounded-2xl border border-[#d1dfd1] bg-white p-5 text-center">
              <h3 className="m-0 text-lg font-extrabold text-[#102113]">Nenhuma oferta encontrada</h3>
              <p className="m-0 text-sm text-[#486048]">Ajuste os filtros ou limpe a busca para ver mais resultados.</p>
              <button type="button" className="btn btn-primary mx-auto !w-auto" onClick={resetFilters}>
                Limpar filtros agora
              </button>
            </article>
          )}
        </section>
      </div>
    </main>
  );
}

export default function OffersPage() {
  return (
    <Suspense fallback={<main className="mx-auto min-h-screen w-full max-w-[1400px] px-3 py-4 md:px-6 md:py-6">Carregando...</main>}>
      <OffersPageContent />
    </Suspense>
  );
}
