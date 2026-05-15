"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OfferCard, type OfferCardData } from "@/components/offer-card";
import { PublicPageHeader } from "@/components/public-page-header";
import { useToast } from "@/components/ui/toast";
import { isSupabaseMode } from "@/lib/runtime-config";
import { generateRedemption, getAuthHeaders, getCurrentUser, getData, initStorage } from "@/lib/storage";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { User } from "@/lib/types";
import { getHotOfferIds, getHotOfferIdsFromSupabase, parseDiscountSortWeight } from "@/lib/utils";

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

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
};

const mapLocalOffers = (): PublicOffer[] => {
  initStorage();
  const data = getData();
  const hotOfferIds = getHotOfferIds(data, 4);
  const companiesById = new Map(data.companies.map((company) => [company.id, company]));

  return data.offers
    .filter((offer) => companiesById.has(offer.companyId))
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

  if (offersRes.error) throw new Error(getErrorMessage(offersRes.error, "Falha ao consultar ofertas no Supabase."));
  if (companiesRes.error) throw new Error(getErrorMessage(companiesRes.error, "Falha ao consultar empresas no Supabase."));

  const offers = (offersRes.data ?? []) as SupabaseOfferRow[];
  const companies = (companiesRes.data ?? []) as SupabaseCompanyRow[];
  const redemptions = redemptionsRes.error
    ? []
    : ((redemptionsRes.data ?? []) as Array<{ offer_id: string; status: "generated" | "used" | "expired" }>);

  const companiesById = new Map(companies.map((company) => [company.id, company]));

  const hotOfferIds = getHotOfferIdsFromSupabase(redemptions, 4);

  return offers
    .filter((offer) => offer.approved && !offer.rejected && companiesById.has(offer.company_id))
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
          setLoadingError(getErrorMessage(error, "Falha ao carregar ofertas."));
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
      if (sortBy === "desconto") {
        const scoreDiff = parseDiscountSortWeight(b.discountLabel) - parseDiscountSortWeight(a.discountLabel);
        if (scoreDiff !== 0) return scoreDiff;
        return b.discountLabel.localeCompare(a.discountLabel, "pt-BR");
      }
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
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
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

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (query.trim()) chips.push({ key: "query", label: `"${query.trim()}"`, clear: () => setQuery("") });
    const effectiveCategory = selectedCategory !== "all" ? selectedCategory : selectedCategoryFromUrl;
    if (effectiveCategory !== "all") chips.push({ key: "category", label: effectiveCategory, clear: () => setSelectedCategory("all") });
    const effectiveNeighborhood = selectedNeighborhood !== "all" ? selectedNeighborhood : selectedNeighborhoodFromUrl;
    if (effectiveNeighborhood !== "all") chips.push({ key: "neighborhood", label: effectiveNeighborhood, clear: () => setSelectedNeighborhood("all") });
    if (selectedPartner !== "all") chips.push({ key: "partner", label: selectedPartner, clear: () => setSelectedPartner("all") });
    if (sortBy !== "recentes") chips.push({ key: "sort", label: sortBy === "desconto" ? "Maior desconto" : "Bairro A-Z", clear: () => setSortBy("recentes") });
    return chips;
  }, [query, selectedCategory, selectedCategoryFromUrl, selectedNeighborhood, selectedNeighborhoodFromUrl, selectedPartner, sortBy]);

  const hotOffers = useMemo(() => filteredOffers.filter((o) => o.isHot), [filteredOffers]);
  const regularOffers = useMemo(() => filteredOffers.filter((o) => !o.isHot), [filteredOffers]);

  const renderCard = (offer: PublicOffer) => (
    <OfferCard
      key={offer.id}
      actionHref={viewer?.role === "consumer" ? undefined : "/auth"}
      actionLabel={viewer?.role === "consumer" ? "Gerar código de resgate" : "Quero essa oferta"}
      onAction={viewer?.role === "consumer" ? () => handleGenerateCode(offer.id) : undefined}
      offer={offer}
    />
  );

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1400px] gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-6 xl:px-8">
      <PublicPageHeader />

      <section className="grid gap-2 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-soft)] md:p-5">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-1 w-6 rounded-full"
            style={{ background: "linear-gradient(90deg, #c9f549 0%, #a8d63a 100%)" }}
            aria-hidden="true"
          />
          <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand)]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Ofertas abertas</p>
        </div>
        <h1 className="m-0 text-3xl leading-tight md:text-4xl" style={{ fontFamily: "var(--font-poppins), sans-serif", fontWeight: 800, color: "#0f1a13" }}>Escolha por bairro, categoria e parceiro.</h1>
        <p className="m-0 max-w-3xl text-sm text-[var(--muted)] md:text-base" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
          Explore os benefícios da Zona Norte com filtros completos para encontrar a melhor oferta para o seu dia.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)] xl:items-start">
        <aside className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-soft)] xl:sticky xl:top-6">
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-base font-bold text-[#0f1a13]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Filtros</h2>
            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--brand)] transition-colors"
                style={{ fontFamily: "var(--font-dm), sans-serif", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Limpar todos
              </button>
            )}
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeFilters.map((chip) => (
                <button key={chip.key} type="button" className="filter-chip" onClick={chip.clear}>
                  {chip.label}
                  <span className="filter-chip-x" aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          )}

          <label className="field">
            <span>Busca</span>
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
              <option value="desconto">Maior desconto</option>
              <option value="bairro">Bairro (A-Z)</option>
            </select>
          </label>
        </aside>

        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 py-3">
            <p className="m-0 text-sm font-semibold text-[var(--success-text)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
              {loading ? (
                <span className="skeleton inline-block h-4 w-48 rounded" />
              ) : (
                <>
                  <span style={{ fontFamily: "var(--font-poppins), sans-serif", fontWeight: 800, color: "#0f1a13" }}>{filteredOffers.length}</span>
                  {" "}oferta{filteredOffers.length !== 1 ? "s" : ""} encontrada{filteredOffers.length !== 1 ? "s" : ""}
                </>
              )}
            </p>
            {viewer?.role === "consumer" ? (
              <span className="badge badge-ok" style={{ fontFamily: "var(--font-poppins), sans-serif", fontSize: 12 }}>
                ✓ Logado — pode resgatar
              </span>
            ) : (
              <Link href="/auth" className="text-sm font-bold text-[var(--brand)] hover:underline" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                Entrar para resgatar →
              </Link>
            )}
          </div>

          {loadingError ? (
            <article className="status-error rounded-2xl px-3 py-2 text-sm">
              Não foi possível carregar as ofertas. Detalhe: {loadingError}
            </article>
          ) : null}

          {loading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card grid gap-3 !rounded-2xl">
                  <div className="skeleton h-[180px] w-full rounded-xl" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                  <div className="skeleton h-5 w-5/6 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-4/5 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {hotOffers.length > 0 && (
                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 18 }}>🔥</span>
                    <h2 className="m-0 text-base font-bold text-[#0f1a13]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Em alta agora</h2>
                    <span className="badge badge-accent" style={{ fontSize: 11, padding: "3px 10px" }}>{hotOffers.length}</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {hotOffers.map(renderCard)}
                  </div>
                  {regularOffers.length > 0 && (
                    <div className="flex items-center gap-3 py-1">
                      <div className="h-px flex-1 bg-[var(--line)]" />
                      <span className="text-xs font-semibold text-[var(--muted)]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Todas as ofertas</span>
                      <div className="h-px flex-1 bg-[var(--line)]" />
                    </div>
                  )}
                </div>
              )}

              {regularOffers.length > 0 && (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {regularOffers.map(renderCard)}
                </div>
              )}

              {filteredOffers.length === 0 && (
                <article className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-8 text-center shadow-[var(--shadow-soft)]">
                  <p style={{ margin: 0, fontSize: 40, lineHeight: 1 }}>🔍</p>
                  <h3 className="m-0 text-lg font-bold text-[#0f1a13]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Nenhuma oferta encontrada</h3>
                  <p className="m-0 text-sm text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>Tente ajustar os filtros ou buscar por outro termo.</p>
                  <button type="button" className="btn btn-primary mx-auto" style={{ width: "auto", paddingInline: 28 }} onClick={resetFilters}>
                    Limpar filtros
                  </button>
                </article>
              )}
            </>
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
