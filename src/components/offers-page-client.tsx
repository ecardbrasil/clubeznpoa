"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OfferCard, type OfferCardData } from "@/components/offer-card";
import { PublicPageHeader } from "@/components/public-page-header";
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

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
};

type OffersPageContentProps = {
  initialOffers: PublicOffer[];
};

function OffersPageContent({ initialOffers }: OffersPageContentProps) {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [allOffers] = useState<PublicOffer[]>(initialOffers);
  const [viewer, setViewer] = useState<User | null>(null);

  useEffect(() => {
    setViewer(getCurrentUser());
  }, []);

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("recentes");
  const [confirmedCode, setConfirmedCode] = useState<{
    code: string;
    offerTitle: string;
    expiresAt: string;
  } | null>(null);

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
        </section>
      </div>

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
