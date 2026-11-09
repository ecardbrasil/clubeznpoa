"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, MapPin, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { OfferCard, type OfferCardData } from "@/components/offer-card";
import { PublicPageHeader } from "@/components/public-page-header";
import { FeaturedOffersCarousel } from "@/components/featured-offers-carousel";
import { useToast } from "@/components/ui/toast";
import { isSupabaseMode } from "@/lib/runtime-config";
import { generateRedemption, getAuthHeaders, getCurrentUser } from "@/lib/storage";
import { User } from "@/lib/types";
import { parseDiscountSortWeight } from "@/lib/utils";

type SortOption = "recentes" | "desconto" | "bairro";

type PublicOffer = OfferCardData & {
  companyId: string;
  createdAt: string;
};

type OffersPageContentProps = {
  initialOffers: PublicOffer[];
};

const PAGE_SIZE = 12;
const ALL = "all";

const SORT_LABELS: Record<SortOption, string> = {
  recentes: "Mais recentes",
  desconto: "Maior desconto",
  bairro: "Bairro (A-Z)",
};

const byPt = (a: string, b: string) => a.localeCompare(b, "pt-BR");

/** Conta ocorrências de uma chave, ordenado por quantidade desc e nome. */
function countBy(offers: PublicOffer[], pick: (o: PublicOffer) => string) {
  const map = new Map<string, number>();
  for (const offer of offers) {
    const key = pick(offer);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1] || byPt(a[0], b[0]));
}

function matchParam(value: string | null, options: string[]) {
  if (!value) return ALL;
  return options.find((item) => item.toLowerCase() === value.toLowerCase()) ?? ALL;
}

type FilterPanelProps = {
  neighborhoods: [string, number][];
  partners: [string, number][];
  neighborhood: string;
  partner: string;
  onNeighborhood: (value: string) => void;
  onPartner: (value: string) => void;
  total: number;
};

/** Painel de filtros reutilizado na sidebar (desktop) e no drawer (mobile), estilo Sympla. */
function FilterPanel({ neighborhoods, partners, neighborhood, partner, onNeighborhood, onPartner, total }: FilterPanelProps) {
  const [showAllHoods, setShowAllHoods] = useState(false);
  const visibleHoods = showAllHoods ? neighborhoods : neighborhoods.slice(0, 6);

  const optionStyle = (active: boolean) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    width: "100%",
    padding: "8px 10px",
    borderRadius: 10,
    border: "none",
    background: active ? "#eefbcf" : "transparent",
    color: active ? "#1a2e0e" : "var(--text)",
    fontFamily: "var(--font-dm), sans-serif",
    fontSize: 14,
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
    textAlign: "left" as const,
  });

  const groupTitle = {
    margin: "0 0 6px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--muted)",
    fontFamily: "var(--font-poppins), sans-serif",
  };

  return (
    <div className="grid gap-5">
      <div>
        <p style={groupTitle}>Bairro</p>
        <div className="grid gap-0.5">
          <button type="button" style={optionStyle(neighborhood === ALL)} onClick={() => onNeighborhood(ALL)}>
            <span>Todos os bairros</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{total}</span>
          </button>
          {visibleHoods.map(([name, count]) => (
            <button key={name} type="button" style={optionStyle(neighborhood === name)} onClick={() => onNeighborhood(name)}>
              <span className="truncate">{name}</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{count}</span>
            </button>
          ))}
          {neighborhoods.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAllHoods((v) => !v)}
              style={{ ...optionStyle(false), color: "var(--brand)", fontWeight: 700, fontSize: 13 }}
            >
              {showAllHoods ? "Ver menos" : `Ver todos (${neighborhoods.length})`}
            </button>
          )}
        </div>
      </div>

      <label className="field">
        <span style={groupTitle}>Parceiro</span>
        <select value={partner} onChange={(e) => onPartner(e.target.value)}>
          <option value={ALL}>Todos os parceiros</option>
          {partners.map(([name, count]) => (
            <option key={name} value={name}>{`${name} (${count})`}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

function OffersPageContent({ initialOffers }: OffersPageContentProps) {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [allOffers] = useState<PublicOffer[]>(initialOffers);
  const [viewer, setViewer] = useState<User | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    setViewer(getCurrentUser());
  }, []);

  useEffect(() => {
    if (!filterDrawerOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFilterDrawerOpen(false); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [filterDrawerOpen]);

  // Estado inicial vem da URL (?q=&categoria=&bairro=) e depois é mantido em sincronia.
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState(() =>
    matchParam(searchParams.get("categoria"), initialOffers.map((o) => o.category)),
  );
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(() =>
    matchParam(searchParams.get("bairro"), initialOffers.map((o) => o.neighborhood)),
  );
  const [selectedPartner, setSelectedPartner] = useState(ALL);
  const [sortBy, setSortBy] = useState<SortOption>("recentes");
  const [pagination, setPagination] = useState({ signature: "", count: PAGE_SIZE });

  // Drawer (mobile) aplica ao confirmar
  const [tempNeighborhood, setTempNeighborhood] = useState(ALL);
  const [tempPartner, setTempPartner] = useState(ALL);

  const [confirmedCode, setConfirmedCode] = useState<{
    code: string;
    offerTitle: string;
    expiresAt: string;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedCategory !== ALL) params.set("categoria", selectedCategory);
    if (selectedNeighborhood !== ALL) params.set("bairro", selectedNeighborhood);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [query, selectedCategory, selectedNeighborhood]);

  const openDrawer = () => {
    setTempNeighborhood(selectedNeighborhood);
    setTempPartner(selectedPartner);
    setFilterDrawerOpen(true);
  };

  const applyDrawer = () => {
    setSelectedNeighborhood(tempNeighborhood);
    setSelectedPartner(tempPartner);
    setFilterDrawerOpen(false);
  };

  const normalizedQuery = query.trim().toLowerCase();

  /** Filtra ignorando uma dimensão, para calcular contagens por faceta (como Sympla). */
  const filterOffers = (skip?: "category" | "neighborhood") =>
    allOffers.filter((offer) => {
      if (skip !== "category" && selectedCategory !== ALL && offer.category !== selectedCategory) return false;
      if (skip !== "neighborhood" && selectedNeighborhood !== ALL && offer.neighborhood !== selectedNeighborhood) return false;
      if (selectedPartner !== ALL && offer.companyName !== selectedPartner) return false;
      if (!normalizedQuery) return true;
      return [offer.title, offer.description, offer.companyName, offer.category, offer.neighborhood]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });

  const categoryFacet = useMemo(
    () => countBy(filterOffers("category"), (o) => o.category),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allOffers, normalizedQuery, selectedNeighborhood, selectedPartner],
  );
  const neighborhoodFacet = useMemo(
    () => countBy(filterOffers("neighborhood"), (o) => o.neighborhood),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allOffers, normalizedQuery, selectedCategory, selectedPartner],
  );
  const partnerFacet = useMemo(
    () => countBy(allOffers, (o) => o.companyName).sort((a, b) => byPt(a[0], b[0])),
    [allOffers],
  );
  const categoryTotal = useMemo(
    () => categoryFacet.reduce((sum, [, count]) => sum + count, 0),
    [categoryFacet],
  );

  const filteredOffers = useMemo(() => {
    const output = filterOffers();
    return output.sort((a, b) => {
      if (sortBy === "desconto") {
        const scoreDiff = parseDiscountSortWeight(b.discountLabel) - parseDiscountSortWeight(a.discountLabel);
        if (scoreDiff !== 0) return scoreDiff;
        return b.discountLabel.localeCompare(a.discountLabel, "pt-BR");
      }
      if (sortBy === "bairro") return byPt(a.neighborhood, b.neighborhood);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allOffers, normalizedQuery, selectedCategory, selectedNeighborhood, selectedPartner, sortBy]);

  const signature = [normalizedQuery, selectedCategory, selectedNeighborhood, selectedPartner, sortBy].join("|");
  const visibleCount = pagination.signature === signature ? pagination.count : PAGE_SIZE;
  const visibleOffers = filteredOffers.slice(0, visibleCount);
  const remaining = filteredOffers.length - visibleOffers.length;

  const resetFilters = () => {
    setQuery("");
    setSelectedCategory(ALL);
    setSelectedNeighborhood(ALL);
    setSelectedPartner(ALL);
    setSortBy("recentes");
  };

  const handleGenerateCode = async (offerId: string) => {
    if (!viewer || viewer.role !== "consumer") return;

    try {
      const offer = allOffers.find((o) => o.id === offerId);
      if (!offer) throw new Error("Oferta não encontrada.");

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
        const payload = (await response.json()) as { error?: string; redemption?: { code: string; expiresAt: string } };
        if (!response.ok || payload.error) {
          throw new Error(payload.error || "Falha ao gerar código de resgate.");
        }
        if (payload.redemption) {
          setConfirmedCode({
            code: payload.redemption.code,
            offerTitle: offer.title,
            expiresAt: payload.redemption.expiresAt,
          });
        }
      } else {
        generateRedemption(viewer.id, offerId);
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        setConfirmedCode({
          code,
          offerTitle: offer.title,
          expiresAt,
        });
      }

      showToast("Código de resgate gerado com sucesso.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Falha ao gerar código de resgate.", "error");
    }
  };


  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (query.trim()) chips.push({ key: "query", label: `"${query.trim()}"`, clear: () => setQuery("") });
    if (selectedNeighborhood !== ALL) chips.push({ key: "neighborhood", label: selectedNeighborhood, clear: () => setSelectedNeighborhood(ALL) });
    if (selectedPartner !== ALL) chips.push({ key: "partner", label: selectedPartner, clear: () => setSelectedPartner(ALL) });
    return chips;
  }, [query, selectedNeighborhood, selectedPartner]);

  const advancedFilterCount = (selectedNeighborhood !== ALL ? 1 : 0) + (selectedPartner !== ALL ? 1 : 0);
  const hasAnyFilter = activeFilters.length > 0 || selectedCategory !== ALL;

  const featuredOffers = useMemo(() => allOffers.filter((o) => o.isFeatured), [allOffers]);

  const renderCard = (offer: PublicOffer) => (
    <OfferCard
      key={offer.id}
      actionHref={viewer?.role === "consumer" ? undefined : "/auth"}
      actionLabel={viewer?.role === "consumer" ? "Gerar código de resgate" : "Quero essa oferta"}
      onAction={viewer?.role === "consumer" ? () => handleGenerateCode(offer.id) : undefined}
      offer={offer}
      showQuickAction
    />
  );

  const heading = selectedCategory !== ALL ? selectedCategory : "Todas as ofertas";

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1400px] content-start gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-6 xl:px-8">
      <PublicPageHeader />

      {/* Barra sticky: busca + ordenação + filtros (mobile) + categorias */}
      <div
        className="sticky top-0 z-30 -mx-3 grid gap-3 px-3 py-3 md:-mx-6 md:px-6 xl:-mx-8 xl:px-8"
        style={{ background: "rgba(243,246,241,0.92)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)" }}
      >
        <div className="flex items-center gap-2">
          <div className="relative flex min-w-0 flex-1 items-center">
            <Search size={18} className="pointer-events-none absolute left-4 text-[var(--muted)]" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ofertas, parceiros, bairros..."
              aria-label="Buscar ofertas"
              style={{
                width: "100%",
                padding: "12px 40px 12px 44px",
                fontSize: 15,
                borderRadius: 999,
                border: "1.5px solid var(--line)",
                background: "#fff",
                fontFamily: "var(--font-dm), sans-serif",
                outline: "none",
                boxShadow: "var(--shadow-soft)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#b7d84b"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
                className="absolute right-3 grid place-items-center rounded-full p-1 text-[var(--muted)]"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <label className="hidden items-center gap-2 md:flex">
            <span className="sr-only">Ordenar por</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Ordenar por"
              style={{
                padding: "11px 36px 11px 16px",
                borderRadius: 999,
                border: "1.5px solid var(--line)",
                background: "#fff",
                fontFamily: "var(--font-poppins), sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
                boxShadow: "var(--shadow-soft)",
              }}
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                <option key={key} value={key}>{SORT_LABELS[key]}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={openDrawer}
            className="flex shrink-0 items-center gap-1.5 lg:hidden"
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: advancedFilterCount > 0 ? "1.5px solid #8ab828" : "1.5px solid var(--line)",
              background: advancedFilterCount > 0 ? "#eefbcf" : "#fff",
              color: "var(--text)",
              fontFamily: "var(--font-poppins), sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            Filtros
            {advancedFilterCount > 0 && (
              <span style={{ background: "#8ab828", color: "#fff", borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "1px 6px" }}>
                {advancedFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Categorias com contagem */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
          {[[ALL, categoryTotal] as [string, number], ...categoryFacet].map(([cat, count]) => {
            const isActive = cat === selectedCategory;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={isActive}
                style={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 999,
                  border: isActive ? "1.5px solid #8ab828" : "1.5px solid var(--line)",
                  background: isActive ? "#b7d84b" : "#fff",
                  color: isActive ? "#1a2e0e" : "var(--muted)",
                  fontFamily: "var(--font-poppins), sans-serif",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {cat === ALL ? "Todas" : cat}
                <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Destaques: só quando não há filtro ativo, como a home do Sympla */}
      {featuredOffers.length > 0 && !hasAnyFilter && (
        <section className="grid gap-3" aria-label="Ofertas em alta">
          <div className="flex items-center gap-2">
            <h2 className="m-0 text-lg font-bold text-[#0f1a13]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Em alta no ClubeZN</h2>
            <span className="badge badge-accent" style={{ fontSize: 11, padding: "3px 10px" }}>{featuredOffers.length}</span>
          </div>
          <FeaturedOffersCarousel
            offers={featuredOffers}
            onCardClick={(offer) => {
              setQuery(offer.title);
            }}
          />
        </section>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar de filtros (desktop) */}
        <aside
          className="sticky hidden rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-soft)] lg:block"
          style={{ top: 132 }}
          aria-label="Filtros"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="m-0 text-base font-bold text-[#0f1a13]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Filtros</h2>
            {hasAnyFilter && (
              <button
                type="button"
                onClick={resetFilters}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--brand)", textDecoration: "underline" }}
              >
                Limpar
              </button>
            )}
          </div>
          <FilterPanel
            neighborhoods={neighborhoodFacet}
            partners={partnerFacet}
            neighborhood={selectedNeighborhood}
            partner={selectedPartner}
            onNeighborhood={setSelectedNeighborhood}
            onPartner={setSelectedPartner}
            total={neighborhoodFacet.reduce((sum, [, c]) => sum + c, 0)}
          />
        </aside>

        {/* Resultados */}
        <section className="grid min-w-0 gap-4" aria-label="Resultados">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0">
              <h2 className="m-0 text-xl font-bold text-[#0f1a13]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>{heading}</h2>
              <p className="m-0 mt-0.5 text-sm text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                <strong style={{ color: "#0f1a13" }}>{filteredOffers.length}</strong>
                {" "}oferta{filteredOffers.length !== 1 ? "s" : ""} encontrada{filteredOffers.length !== 1 ? "s" : ""}
                {selectedNeighborhood !== ALL && (
                  <>
                    {" "}em <MapPin size={12} className="inline align-[-1px]" aria-hidden="true" /> {selectedNeighborhood}
                  </>
                )}
              </p>
            </div>
            {viewer?.role === "consumer" ? (
              <span className="badge badge-ok" style={{ fontSize: 12 }}><Check size={13} aria-hidden="true" style={{ marginRight: 4 }} />Logado, pode resgatar</span>
            ) : (
              <Link href="/auth" className="inline-flex min-h-9 items-center text-sm font-bold text-[var(--brand)] hover:underline" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                Entrar para resgatar →
              </Link>
            )}
          </div>

          {activeFilters.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              {activeFilters.map((chip) => (
                <button key={chip.key} type="button" className="filter-chip" onClick={chip.clear}>
                  {chip.label}
                  <span className="filter-chip-x" aria-hidden="true">×</span>
                </button>
              ))}
              <button
                type="button"
                onClick={resetFilters}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--muted)", padding: "3px 6px", textDecoration: "underline" }}
              >
                Limpar todos
              </button>
            </div>
          )}

          {visibleOffers.length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">
              {visibleOffers.map(renderCard)}
            </div>
          )}

          {remaining > 0 && (
            <button
              type="button"
              className="btn btn-ghost mx-auto"
              style={{ width: "auto", paddingInline: 32 }}
              onClick={() => setPagination({ signature, count: visibleCount + PAGE_SIZE })}
            >
              Ver mais ofertas ({remaining})
            </button>
          )}

          {filteredOffers.length === 0 && (
            <article className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-8 text-center shadow-[var(--shadow-soft)]">
              <SearchX size={40} aria-hidden="true" className="mx-auto text-[var(--muted)]" />
              <h3 className="m-0 text-lg font-bold text-[#0f1a13]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Nenhuma oferta encontrada</h3>
              <p className="m-0 text-sm text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>Tente ajustar os filtros ou buscar por outro termo.</p>
              <button type="button" className="btn btn-primary mx-auto" style={{ width: "auto", paddingInline: 28 }} onClick={resetFilters}>
                Limpar filtros
              </button>
            </article>
          )}
        </section>
      </div>

      {/* Drawer de filtros (mobile/tablet) */}
      {filterDrawerOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end" }}
          onClick={() => setFilterDrawerOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              maxHeight: "85vh",
              overflowY: "auto",
              margin: "0 auto",
              background: "#fff",
              borderRadius: "20px 20px 0 0",
              padding: "20px 20px 28px",
              display: "grid",
              gap: 16,
              boxShadow: "0 -4px 32px rgba(0,0,0,0.14)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, fontFamily: "var(--font-poppins), sans-serif", color: "#0f1a13" }}>Filtros</h3>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                aria-label="Fechar filtros"
                style={{ background: "none", border: "1px solid var(--line)", borderRadius: 999, width: 30, height: 30, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--muted)" }}
              >
                <X size={14} />
              </button>
            </div>

            <label className="field">
              <span>Ordenar por</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
                {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                  <option key={key} value={key}>{SORT_LABELS[key]}</option>
                ))}
              </select>
            </label>

            <FilterPanel
              neighborhoods={neighborhoodFacet}
              partners={partnerFacet}
              neighborhood={tempNeighborhood}
              partner={tempPartner}
              onNeighborhood={setTempNeighborhood}
              onPartner={setTempPartner}
              total={neighborhoodFacet.reduce((sum, [, c]) => sum + c, 0)}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => { setTempNeighborhood(ALL); setTempPartner(ALL); }}
                style={{ flex: 1, padding: "11px 0", borderRadius: 999, border: "1.5px solid var(--line)", background: "#fff", fontFamily: "var(--font-poppins), sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "var(--muted)" }}
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={applyDrawer}
                style={{ flex: 2, padding: "11px 0", borderRadius: 999, border: "none", background: "#b7d84b", fontFamily: "var(--font-poppins), sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#1a2e0e", boxShadow: "0 2px 8px rgba(183,216,75,0.4)" }}
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redemption code modal */}
      {confirmedCode && (
        <section
          className="offer-modal-overlay"
          onClick={() => setConfirmedCode(null)}
          aria-label="Fechar confirmação"
        >
          <article
            className="card offer-modal-panel"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480, margin: "auto" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start", position: "sticky", top: 0, background: "var(--panel)", zIndex: 2, padding: "4px 0 8px", borderBottom: "1px solid var(--line)", marginBottom: 4 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-dm), sans-serif" }}>Código gerado com sucesso!</p>
                <h3 style={{ margin: "6px 0 0", fontSize: 20, fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700, color: "#0f1a13", lineHeight: 1.25 }}>{confirmedCode.offerTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmedCode(null)}
                aria-label="Fechar modal"
                style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: 999,
                  border: "1px solid var(--line)", background: "#fff",
                  display: "grid", placeItems: "center", cursor: "pointer",
                  color: "var(--muted)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div style={{ padding: "2rem", textAlign: "center" }}>
              <p style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", fontFamily: "var(--font-dm), sans-serif" }}>Seu código de resgate:</p>
              <div style={{ fontSize: "2.5rem", letterSpacing: "0.3em", padding: "1rem 2rem", display: "inline-block", fontFamily: "monospace", fontWeight: 700, background: "var(--panel)", borderRadius: "0.5rem", border: "1px solid var(--line)", color: "#0f1a13" }}>
                {confirmedCode.code}
              </div>
              <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--muted)", fontFamily: "var(--font-dm), sans-serif" }}>
                Válido por 10 minutos · expira às {new Date(confirmedCode.expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <hr style={{ margin: "1.5rem 0", border: "none", borderTop: "1px solid var(--line)" }} />
              <p style={{ fontSize: "0.95rem", fontFamily: "var(--font-dm), sans-serif", marginBottom: "1.5rem" }}>
                Você pode acessar todos os seus códigos a qualquer momento no{" "}
                <Link href="/consumer" onClick={() => setConfirmedCode(null)} style={{ color: "var(--brand)", textDecoration: "underline", fontWeight: 600 }}>
                  seu painel
                </Link>
                .
              </p>
              <button
                type="button"
                className="btn btn-coupon"
                onClick={() => setConfirmedCode(null)}
                style={{ marginTop: "1rem", width: "100%" }}
              >
                Fechar
              </button>
            </div>
          </article>
        </section>
      )}
    </main>
  );
}

export function OffersPageClient({ initialOffers }: { initialOffers: PublicOffer[] }) {
  return (
    <Suspense fallback={<main className="mx-auto min-h-screen w-full max-w-[1400px] px-3 py-4 md:px-6 md:py-6">Carregando...</main>}>
      <OffersPageContent initialOffers={initialOffers} />
    </Suspense>
  );
}
