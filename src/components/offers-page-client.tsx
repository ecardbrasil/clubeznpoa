"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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

function OffersPageContent({ initialOffers }: OffersPageContentProps) {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [allOffers] = useState<PublicOffer[]>(initialOffers);
  const [viewer, setViewer] = useState<User | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewer(getCurrentUser());
  }, []);

  useEffect(() => {
    if (!filterDrawerOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFilterDrawerOpen(false); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [filterDrawerOpen]);

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("recentes");

  // Drawer temp state (applied on confirm)
  const [tempNeighborhood, setTempNeighborhood] = useState("all");
  const [tempPartner, setTempPartner] = useState("all");
  const [tempSort, setTempSort] = useState<SortOption>("recentes");

  const [confirmedCode, setConfirmedCode] = useState<{
    code: string;
    offerTitle: string;
    expiresAt: string;
  } | null>(null);

  const openDrawer = () => {
    setTempNeighborhood(selectedNeighborhood);
    setTempPartner(selectedPartner);
    setTempSort(sortBy);
    setFilterDrawerOpen(true);
  };

  const applyDrawer = () => {
    setSelectedNeighborhood(tempNeighborhood);
    setSelectedPartner(tempPartner);
    setSortBy(tempSort);
    setFilterDrawerOpen(false);
  };

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
    const effectiveNeighborhood = selectedNeighborhood !== "all" ? selectedNeighborhood : selectedNeighborhoodFromUrl;
    if (effectiveNeighborhood !== "all") chips.push({ key: "neighborhood", label: effectiveNeighborhood, clear: () => setSelectedNeighborhood("all") });
    if (selectedPartner !== "all") chips.push({ key: "partner", label: selectedPartner, clear: () => setSelectedPartner("all") });
    if (sortBy !== "recentes") chips.push({ key: "sort", label: sortBy === "desconto" ? "Maior desconto" : "Bairro A-Z", clear: () => setSortBy("recentes") });
    return chips;
  }, [query, selectedNeighborhood, selectedNeighborhoodFromUrl, selectedPartner, sortBy]);

  // Count advanced filters active (drawer ones only)
  const advancedFilterCount = useMemo(() => {
    let count = 0;
    const effectiveNeighborhood = selectedNeighborhood !== "all" ? selectedNeighborhood : selectedNeighborhoodFromUrl;
    if (effectiveNeighborhood !== "all") count++;
    if (selectedPartner !== "all") count++;
    if (sortBy !== "recentes") count++;
    return count;
  }, [selectedNeighborhood, selectedNeighborhoodFromUrl, selectedPartner, sortBy]);

  const featuredOffers = useMemo(() => allOffers.filter((o) => o.isFeatured), [allOffers]);
  const regularOffers = useMemo(() => filteredOffers.filter((o) => !o.isFeatured), [filteredOffers]);

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

      {featuredOffers.length > 0 && (
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 18 }}>⭐</span>
            <h2 className="m-0 text-base font-bold text-[#0f1a13]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Ofertas em alta</h2>
            <span className="badge badge-accent" style={{ fontSize: 11, padding: "3px 10px" }}>{featuredOffers.length}</span>
          </div>
          <FeaturedOffersCarousel
            offers={featuredOffers}
            onCardClick={(offer) => {
              const el = document.getElementById(offer.id);
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          />
        </div>
      )}

      {/* Search + filter controls */}
      <div className="grid gap-3">
        {/* Search bar */}
        <div className="relative flex items-center">
          <svg
            className="pointer-events-none absolute left-4 text-[var(--muted)]"
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ofertas, parceiros, bairros..."
            style={{
              width: "100%",
              paddingLeft: 44,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
              fontSize: 15,
              borderRadius: 999,
              border: "1.5px solid var(--line)",
              background: "#fff",
              fontFamily: "var(--font-dm), sans-serif",
              outline: "none",
              boxShadow: "var(--shadow-soft)",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#b7d84b"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              style={{
                position: "absolute", right: 14,
                background: "none", border: "none", cursor: "pointer",
                color: "var(--muted)", display: "grid", placeItems: "center",
                padding: 4, borderRadius: 999,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Category chips + Filters button */}
        <div className="flex items-center gap-2">
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              flex: 1,
              paddingBottom: 2,
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {categories.map((cat) => {
              const effective = selectedCategory !== "all" ? selectedCategory : selectedCategoryFromUrl;
              const isActive = cat === effective;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    flexShrink: 0,
                    padding: "7px 16px",
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
                    boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                  }}
                >
                  {cat === "all" ? "Todas" : cat}
                </button>
              );
            })}
          </div>

          {/* Filters button */}
          <button
            type="button"
            onClick={openDrawer}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 999,
              border: advancedFilterCount > 0 ? "1.5px solid #8ab828" : "1.5px solid var(--line)",
              background: advancedFilterCount > 0 ? "#eefbcf" : "#fff",
              color: advancedFilterCount > 0 ? "#1a2e0e" : "var(--muted)",
              fontFamily: "var(--font-poppins), sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filtros
            {advancedFilterCount > 0 && (
              <span style={{
                background: "#8ab828", color: "#fff",
                borderRadius: 999, fontSize: 11, fontWeight: 700,
                padding: "1px 6px", lineHeight: 1.4,
              }}>
                {advancedFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active filter chips */}
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
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, color: "var(--muted)",
                fontFamily: "var(--font-dm), sans-serif", padding: "3px 6px",
                textDecoration: "underline",
              }}
            >
              Limpar todos
            </button>
          </div>
        )}

        {/* Results count + auth status */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 text-sm font-semibold text-[var(--success-text)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
            <span style={{ fontFamily: "var(--font-poppins), sans-serif", fontWeight: 800, color: "#0f1a13" }}>{filteredOffers.length}</span>
            {" "}oferta{filteredOffers.length !== 1 ? "s" : ""} encontrada{filteredOffers.length !== 1 ? "s" : ""}
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
      </div>

      {/* Offers grid — full width */}
      {regularOffers.length > 0 && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
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

      {/* Filter drawer */}
      {filterDrawerOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "flex-end",
          }}
          onClick={() => setFilterDrawerOpen(false)}
        >
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Filtros avançados"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              margin: "0 auto",
              background: "#fff",
              borderRadius: "20px 20px 0 0",
              padding: "24px 20px 32px",
              display: "grid",
              gap: 16,
              boxShadow: "0 -4px 32px rgba(0,0,0,0.14)",
            }}
          >
            {/* Handle bar */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: -8 }}>
              <div style={{ width: 40, height: 4, borderRadius: 999, background: "#e0e0e0" }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, fontFamily: "var(--font-poppins), sans-serif", color: "#0f1a13" }}>
                Filtros avançados
              </h3>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                aria-label="Fechar filtros"
                style={{
                  background: "none", border: "1px solid var(--line)", borderRadius: 999,
                  width: 30, height: 30, display: "grid", placeItems: "center",
                  cursor: "pointer", color: "var(--muted)",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <label className="field">
              <span>Bairro</span>
              <select value={tempNeighborhood} onChange={(e) => setTempNeighborhood(e.target.value)}>
                {neighborhoods.map((n) => (
                  <option key={n} value={n}>{n === "all" ? "Todos os bairros" : n}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Parceiro</span>
              <select value={tempPartner} onChange={(e) => setTempPartner(e.target.value)}>
                {partners.map((p) => (
                  <option key={p} value={p}>{p === "all" ? "Todos os parceiros" : p}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Ordenar por</span>
              <select value={tempSort} onChange={(e) => setTempSort(e.target.value as SortOption)}>
                <option value="recentes">Mais recentes</option>
                <option value="desconto">Maior desconto</option>
                <option value="bairro">Bairro (A-Z)</option>
              </select>
            </label>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => {
                  setTempNeighborhood("all");
                  setTempPartner("all");
                  setTempSort("recentes");
                }}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 999,
                  border: "1.5px solid var(--line)", background: "#fff",
                  fontFamily: "var(--font-poppins), sans-serif", fontSize: 14,
                  fontWeight: 600, cursor: "pointer", color: "var(--muted)",
                  transition: "all 0.15s",
                }}
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={applyDrawer}
                style={{
                  flex: 2, padding: "11px 0", borderRadius: 999,
                  border: "none", background: "#b7d84b",
                  fontFamily: "var(--font-poppins), sans-serif", fontSize: 14,
                  fontWeight: 700, cursor: "pointer", color: "#1a2e0e",
                  transition: "all 0.15s",
                  boxShadow: "0 2px 8px rgba(183,216,75,0.4)",
                }}
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
