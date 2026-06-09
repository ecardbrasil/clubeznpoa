"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Heart,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { OfferCard, type OfferCardData } from "@/components/offer-card";
import { SiteHeader } from "@/components/site-header";
import type { Company } from "@/lib/types";

const categories = [
  { label: "Beleza & Spa", slug: "Beleza", icon: Heart },
  { label: "Gastronomia", slug: "Gastronomia", icon: Sparkles },
  { label: "Lazer", slug: "Lazer", icon: Users },
  { label: "Serviços", slug: "Servicos", icon: Handshake },
  { label: "Saúde", slug: "Saude", icon: ShieldCheck },
  { label: "Lojas", slug: "Lojas", icon: Store },
  { label: "Outros", slug: "Outros", icon: Tag },
];

const northZoneNeighborhoods = [
  "Sarandi",
  "Passo d'Areia",
  "Jardim Lindóia",
  "São João",
  "Cristo Redentor",
  "Vila Ipiranga",
  "Rubem Berta",
  "Jardim Leopoldina",
];

const promoBanners = [
  {
    title: "Beleza & Bem-estar",
    subtitle: "Descontos de até 70% em spas e salões",
    slug: "Beleza",
    gradient: "from-[#1e3228] via-[#2a4a38] to-[#1a2e22]",
    accent: "#C9F549",
    emoji: "✨",
  },
  {
    title: "Gastronomia Local",
    subtitle: "Restaurantes e cafés da Zona Norte",
    slug: "Gastronomia",
    gradient: "from-[#0f1a13] via-[#1e3228] to-[#0a1209]",
    accent: "#C9F549",
    emoji: "🍽️",
  },
  {
    title: "Lazer & Diversão",
    subtitle: "Experiências únicas perto de você",
    slug: "Lazer",
    gradient: "from-[#1a2e22] via-[#243d2e] to-[#131e16]",
    accent: "#C9F549",
    emoji: "🎉",
  },
];

const footerLinks = {
  ofertas: [
    { label: "Todas as ofertas", href: "/ofertas" },
    { label: "Parceiros", href: "/parceiros" },
    { label: "Como funciona", href: "/sobre" },
    { label: "FAQ", href: "/faq" },
  ],
  institucional: [
    { label: "Sobre nós", href: "/sobre" },
    { label: "LGPD", href: "/lgpd" },
    { label: "Privacidade", href: "/privacidade" },
    { label: "Termos de uso", href: "/termos-de-uso" },
    { label: "Suporte", href: "/suporte" },
  ],
};

const searchHints = ["Salão de Beleza", "Colégio Particular", "Restaurante"];

function SkeletonCard() {
  return (
    <div className="flex h-full min-h-[460px] flex-col gap-3 p-4 animate-pulse">
      <div className="relative -mx-4 -mt-4 aspect-square overflow-hidden bg-[#e7eddc]">
        <div className="absolute left-3 top-3 h-5 w-24 rounded-full bg-white/75" />
        <div className="absolute right-3 top-3 flex gap-1.5 rounded-full bg-black/25 px-2 py-1">
          <div className="h-3 w-3 rounded-full bg-[#c9f549]" />
          <div className="h-3 w-3 rounded-full bg-[#c9f549]/70" />
        </div>
      </div>
      <div className="h-4 rounded-full bg-[#e7eddc]" />
      <div className="h-6 w-4/5 rounded-full bg-[#e7eddc]" />
      <div className="space-y-2">
        <div className="h-3 rounded-full bg-[#e7eddc]" />
        <div className="h-3 rounded-full bg-[#e7eddc] w-11/12" />
        <div className="h-3 rounded-full bg-[#e7eddc] w-4/5" />
      </div>
      <div className="mt-auto h-4 w-3/5 rounded-full bg-[#e7eddc]" />
    </div>
  );
}

function AnimatedSearchHint() {
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setHintIndex((current) => (current + 1) % searchHints.length);
    }, 2200);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeHint = searchHints[hintIndex];

  return (
    <div className="pointer-events-none absolute inset-y-0 left-12 flex items-center pr-24 text-sm font-medium">
      <span className="whitespace-nowrap text-[#44584c]">Pesquisar</span>
      <span className="relative ml-2 h-5 overflow-hidden whitespace-nowrap text-[#1e3228]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={activeHint}
            className="absolute left-0 top-0"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {activeHint}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}

type HomePageClientProps = {
  initialData: {
    trendingOffers: OfferCardData[];
    featuredOffers: OfferCardData[];
    partnerProfiles: Company[];
  };
};

export function HomePageClient({ initialData }: HomePageClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [trendingOffers] = useState<OfferCardData[]>(initialData.trendingOffers);
  const [featuredOffers] = useState<OfferCardData[]>(initialData.featuredOffers);
  const [partnerProfiles] = useState<Company[]>(initialData.partnerProfiles);
  const [canScrollTrendingOffersPrev, setCanScrollTrendingOffersPrev] = useState(false);
  const [canScrollTrendingOffersNext, setCanScrollTrendingOffersNext] = useState(false);
  const [canScrollOffersPrev, setCanScrollOffersPrev] = useState(false);
  const [canScrollOffersNext, setCanScrollOffersNext] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const trendingOffersTrackRef = useRef<HTMLDivElement>(null);
  const featuredOffersTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trendingOffersTrackRef.current;
    if (!track) return;

    const updateScrollState = () => {
      const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
      setCanScrollTrendingOffersPrev(track.scrollLeft > 4);
      setCanScrollTrendingOffersNext(track.scrollLeft < maxScrollLeft - 4);
    };

    updateScrollState();
    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [trendingOffers.length]);

  useEffect(() => {
    const track = featuredOffersTrackRef.current;
    if (!track) return;

    const updateScrollState = () => {
      const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
      setCanScrollOffersPrev(track.scrollLeft > 4);
      setCanScrollOffersNext(track.scrollLeft < maxScrollLeft - 4);
    };

    updateScrollState();
    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [featuredOffers.length]);

  const scrollTrendingOffers = (direction: -1 | 1) => {
    const track = trendingOffersTrackRef.current;
    if (!track) return;

    const distance = Math.max(track.clientWidth * 0.82, 280);
    track.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  const scrollFeaturedOffers = (direction: -1 | 1) => {
    const track = featuredOffersTrackRef.current;
    if (!track) return;

    const distance = Math.max(track.clientWidth * 0.82, 280);
    track.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/ofertas?q=${encodeURIComponent(q)}`);
    else router.push("/ofertas");
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden" style={{ background: "var(--bg)" }}>
      <style>{`
        .czn-search-wrap { position: relative; }
        .czn-search-wrap:focus-within .czn-search-icon { color: #1e3228; }

        .czn-cat-pill {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 10px 16px; border-radius: 9999px;
          border: 1.5px solid #dfe5d4; background: #fff;
          font-family: var(--font-poppins); font-size: 13px; font-weight: 600;
          color: #1e3228; white-space: nowrap; cursor: pointer;
          transition: all 0.2s ease; text-decoration: none;
        }
        .czn-cat-pill:hover { border-color: #C9F549; background: #f3f6f1; transform: translateY(-1px); }

        .czn-hero-banner {
          background: linear-gradient(135deg, #1e3228 0%, #13210f 60%, #0a1209 100%);
          position: relative; overflow: hidden;
        }
        .czn-hero-banner::before {
          content: ''; position: absolute; top: -40%; right: -5%; width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(201,245,73,0.12) 0%, transparent 65%);
          border-radius: 50%; pointer-events: none;
        }
        .czn-hero-banner::after {
          content: ''; position: absolute; bottom: -30%; left: 5%; width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(201,245,73,0.06) 0%, transparent 70%);
          border-radius: 50%; pointer-events: none;
        }

        .czn-offer-carousel {
          position: relative;
        }
        .czn-offer-carousel-track {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-padding-inline: 16px;
          padding: 2px 2px 10px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .czn-offer-carousel-track::-webkit-scrollbar {
          display: none;
        }
        .czn-offer-slide {
          flex: 0 0 auto;
          display: flex;
          align-items: stretch;
          width: min(82vw, 320px);
          scroll-snap-align: start;
        }
        @media (min-width: 768px) {
          .czn-offer-slide {
            width: 340px;
          }
        }
        .czn-carousel-button {
          width: 44px;
          height: 44px;
          border-radius: 9999px;
          border: 1px solid #dfe5d4;
          background: #fff;
          color: #1e3228;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 18px rgba(17, 35, 24, 0.08);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .czn-carousel-button:hover:not(:disabled) {
          border-color: #C9F549;
          background: #f3f6f1;
        }
        .czn-carousel-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }

        .czn-partner-card {
          background: #fff; border: 1.5px solid #dfe5d4; border-radius: 16px;
          padding: 20px; display: flex; flex-direction: column; gap: 10px;
          transition: all 0.2s ease; text-decoration: none; color: inherit;
        }
        .czn-partner-card:hover { border-color: #C9F549; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,245,73,0.12); }

        .czn-stats-bar {
          background: linear-gradient(135deg, #1e3228 0%, #13210f 100%);
        }

        .czn-promo-tile {
          border-radius: 20px; overflow: hidden; position: relative;
          min-height: 180px; cursor: pointer; transition: transform 0.2s ease;
          text-decoration: none; display: block;
        }
        .czn-promo-tile:hover { transform: scale(1.02); }

        .czn-section-title {
          font-family: var(--font-poppins); font-size: clamp(22px, 4vw, 32px);
          font-weight: 800; color: #18231c; line-height: 1.25;
        }
        .czn-section-label {
          display: inline-flex; align-items: center; gap: 6px;
          background: #C9F549; border-radius: 9999px; padding: 4px 14px;
          font-size: 11px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase;
          color: #0a0f0c;
        }

        .czn-footer { background: #1e3228; color: #c8d8c4; }
        .czn-footer a { color: #c8d8c4; text-decoration: none; transition: color 0.2s; }
        .czn-footer a:hover { color: #C9F549; }

        .czn-neighborhood-scroll {
          display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;
          scrollbar-width: none;
        }
        .czn-neighborhood-scroll::-webkit-scrollbar { display: none; }

        .czn-neigh-pill {
          display: flex; align-items: center; gap: 6px; white-space: nowrap;
          padding: 8px 16px; border-radius: 9999px; border: 1.5px solid #dfe5d4;
          background: #fff; font-weight: 600; font-size: 13px; color: #1e3228;
          text-decoration: none; transition: all 0.2s ease; flex-shrink: 0;
        }
        .czn-neigh-pill:hover { border-color: #C9F549; background: #f3f6f1; }
      `}</style>

      {/* Announcement Bar */}
      <AnimatePresence>
        {announcementVisible && (
          <motion.div
            initial={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
            style={{ background: "#C9F549" }}
          >
            <div className="flex items-center justify-center gap-3 px-4 py-2.5 text-[#0a0f0c] relative max-w-7xl mx-auto">
              <Sparkles size={14} className="shrink-0" />
              <p className="text-xs font-bold text-center" style={{ fontFamily: "var(--font-poppins)" }}>
                Novidades exclusivas na Zona Norte de Porto Alegre —{" "}
                <Link href="/auth?tab=register" className="underline underline-offset-2 hover:no-underline">
                  Cadastre-se grátis
                </Link>
              </p>
              <button
                onClick={() => setAnnouncementVisible(false)}
                className="absolute right-4 p-1 rounded hover:bg-black/10 transition-colors"
                aria-label="Fechar aviso"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <SiteHeader sticky smallLogo className="md:px-6 relative z-20" />

      {/* Search + Category Nav */}
      <div className="bg-white border-b border-[#dfe5d4]">
        <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 space-y-3">
          <form onSubmit={handleSearch} className="czn-search-wrap">
            <div className="flex items-center gap-2 rounded-xl border-2 border-[#dfe5d4] bg-[#f3f6f1] px-4 py-3 focus-within:border-[#1e3228] transition-colors">
              <Search size={18} className="czn-search-icon text-[#44584c] shrink-0 transition-colors" />
              <div className="relative flex-1 min-w-0">
                {!searchQuery && <AnimatedSearchHint />}
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar"
                  className="w-full min-w-0 bg-transparent text-sm font-medium text-[#18231c] outline-none placeholder:text-transparent"
                  style={{ fontFamily: "var(--font-dm)" }}
                />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[#44584c] hover:text-[#18231c] transition-colors"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="submit"
                className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3228] text-white transition-all hover:bg-[#13210f] active:scale-95"
                style={{ fontFamily: "var(--font-poppins)" }}
                aria-label="Buscar"
              >
                <Search size={18} />
              </button>
            </div>
          </form>

          {/* Category pills */}
          <div className="czn-neighborhood-scroll py-1">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/ofertas?categoria=${encodeURIComponent(cat.slug)}`}
                className="czn-cat-pill"
              >
                <cat.icon size={16} />
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-10 md:px-6 space-y-14">

        {/* Trending Offers */}
        <section>
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div className="space-y-1">
              <span className="czn-section-label">✦ Em destaque</span>
              <h2 className="czn-section-title">Ofertas da semana</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="czn-carousel-button"
                onClick={() => scrollTrendingOffers(-1)}
                disabled={!canScrollTrendingOffersPrev}
                aria-label="Ver ofertas anteriores"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="czn-carousel-button"
                onClick={() => scrollTrendingOffers(1)}
                disabled={!canScrollTrendingOffersNext}
                aria-label="Ver próximas ofertas"
              >
                <ChevronRight size={18} />
              </button>
              <Link
                href="/ofertas"
                className="flex items-center gap-1.5 rounded-xl border border-[#dfe5d4] bg-white px-4 py-2.5 text-sm font-bold text-[#1e3228] no-underline transition-all hover:border-[#C9F549] hover:bg-[#f3f6f1]"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Ver todas
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          {trendingOffers.length > 0 ? (
            <div ref={trendingOffersTrackRef} className="czn-offer-carousel-track">
              {trendingOffers.map((offer, idx) => (
                <motion.div
                  key={offer.id}
                  className="czn-offer-slide"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <OfferCard
                    offer={offer}
                    actionLabel="Resgatar"
                    actionHref="/auth"
                    secondaryLabel="Ver detalhes"
                    variant="landing-carousel"
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div ref={trendingOffersTrackRef} className="czn-offer-carousel-track">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="czn-offer-slide">
                  <SkeletonCard />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Hero Banner */}
        <section className="czn-hero-banner rounded-2xl">
          <div className="max-w-7xl mx-auto px-4 py-14 md:px-6 md:py-20 relative z-10">
            <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-12">
              <motion.div
                className="space-y-5 order-2 md:order-1"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              >
                <motion.span
                  className="inline-flex items-center gap-2 rounded-full border border-[#C9F549]/40 bg-[#C9F549]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#C9F549]"
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <MapPin size={12} />
                  Zona Norte, Porto Alegre
                </motion.span>

                <h1
                  className="text-4xl font-black leading-[1.15] text-white md:text-6xl"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  Descontos que{" "}
                  <span
                    className="relative"
                    style={{
                      background: "linear-gradient(90deg, #C9F549 0%, #a8d63a 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    impactam
                  </span>
                  .<br />
                  Na sua região.
                </h1>

                <p
                  className="text-lg leading-relaxed text-[#9db8a8] max-w-xl"
                  style={{ fontFamily: "var(--font-dm)" }}
                >
                  Parceiros locais da Zona Norte com ofertas reais. Simples de resgatar, perto de
                  você.
                </p>

                <div className="flex flex-wrap gap-3 pt-1">
                  <Link
                    href="/ofertas"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#C9F549] px-6 py-3.5 text-sm font-black text-[#0a0f0c] no-underline transition-all hover:bg-[#d4f75e] hover:shadow-lg hover:shadow-[#C9F549]/25 active:scale-95"
                    style={{ fontFamily: "var(--font-poppins)" }}
                  >
                    Ver ofertas
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/auth?tab=register"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white no-underline backdrop-blur transition-all hover:bg-white/20 active:scale-95"
                    style={{ fontFamily: "var(--font-poppins)" }}
                  >
                    Cadastrar grátis
                  </Link>
                </div>
              </motion.div>

              {/* Hero Image */}
              <motion.div
                className="relative flex items-center justify-center order-1 md:order-2"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.7 }}
                viewport={{ once: true }}
              >
                <img
                  src="/images/hero-phone.jpg"
                  alt="Usuário segurando telefone com ClubeZN"
                  className="w-full max-w-sm rounded-2xl shadow-2xl object-cover"
                  loading="lazy"
                />
              </motion.div>

              {/* Stats grid */}
              <motion.div
                className="grid grid-cols-2 gap-4"
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                viewport={{ once: true }}
              >
                {[
                  { value: "8+", label: "Bairros cobertos", icon: MapPin },
                  { value: "100+", label: "Parceiros ativos", icon: Store },
                  { value: "1000+", label: "Ofertas disponíveis", icon: Tag },
                  { value: "0%", label: "Taxa para consumidor", icon: Wallet },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
                    viewport={{ once: true }}
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <stat.icon size={20} className="mb-2" style={{ color: "#C9F549" }} />
                    <p
                      className="text-3xl font-black text-white"
                      style={{ fontFamily: "var(--font-poppins)" }}
                    >
                      {stat.value}
                    </p>
                    <p className="text-xs text-[#9db8a8] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Promo Category Tiles */}
        <section>
          <div className="space-y-1 mb-6">
            <span className="czn-section-label">✦ Categorias</span>
            <h2 className="czn-section-title">Explore por categoria</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {promoBanners.map((banner, idx) => (
              <motion.div
                key={banner.slug}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Link
                  href={`/ofertas?categoria=${encodeURIComponent(banner.slug)}`}
                  className="czn-promo-tile"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${banner.gradient}`} />
                  <div className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: "radial-gradient(circle at 80% 20%, rgba(201,245,73,0.3) 0%, transparent 50%)",
                    }}
                  />
                  <div className="relative z-10 p-6 h-full flex flex-col justify-between min-h-[180px]">
                    <div>
                      <span className="text-3xl">{banner.emoji}</span>
                      <h3
                        className="mt-3 text-xl font-black text-white leading-tight"
                        style={{ fontFamily: "var(--font-poppins)" }}
                      >
                        {banner.title}
                      </h3>
                      <p className="mt-1 text-sm text-[#9db8a8]" style={{ fontFamily: "var(--font-dm)" }}>
                        {banner.subtitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-4">
                      <span
                        className="text-sm font-bold"
                        style={{ color: banner.accent, fontFamily: "var(--font-poppins)" }}
                      >
                        Ver ofertas
                      </span>
                      <ArrowRight size={14} style={{ color: banner.accent }} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Partner Highlights */}
        {partnerProfiles.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div className="space-y-1">
                <span className="czn-section-label">✦ Parceiros</span>
                <h2 className="czn-section-title">Parceiros em destaque</h2>
              </div>
              <Link
                href="/parceiros"
                className="flex items-center gap-1.5 rounded-xl border border-[#dfe5d4] bg-white px-4 py-2.5 text-sm font-bold text-[#1e3228] no-underline transition-all hover:border-[#C9F549] hover:bg-[#f3f6f1]"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Ver todos
                <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {partnerProfiles.map((partner, idx) => (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <Link href={`/parceiros/${partner.id}`} className="czn-partner-card">
                    <div className="flex items-start gap-3">
                      {partner.logoImage ? (
                        <img
                          src={partner.logoImage}
                          alt={partner.publicName ?? partner.name}
                          className="h-12 w-12 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black"
                          style={{ background: "#C9F549", color: "#0a0f0c", fontFamily: "var(--font-poppins)" }}
                        >
                          {(partner.publicName ?? partner.name).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p
                          className="font-bold text-[#18231c] truncate"
                          style={{ fontFamily: "var(--font-poppins)" }}
                        >
                          {partner.publicName ?? partner.name}
                        </p>
                        <p className="text-xs text-[#44584c] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>
                          {partner.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#44584c]">
                      <MapPin size={12} className="text-[#C9F549] shrink-0" />
                      <span style={{ fontFamily: "var(--font-dm)" }}>{partner.neighborhood}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Featured / Secondary Offers */}
        {featuredOffers.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div className="space-y-1">
                <span className="czn-section-label">✦ Mais ofertas</span>
                <h2 className="czn-section-title">Não perca essas oportunidades</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="czn-carousel-button"
                  onClick={() => scrollFeaturedOffers(-1)}
                  disabled={!canScrollOffersPrev}
                  aria-label="Ver ofertas anteriores"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="czn-carousel-button"
                  onClick={() => scrollFeaturedOffers(1)}
                  disabled={!canScrollOffersNext}
                  aria-label="Ver próximas ofertas"
                >
                  <ChevronRight size={18} />
                </button>
              <Link
                href="/ofertas"
                className="flex items-center gap-1.5 rounded-xl border border-[#dfe5d4] bg-white px-4 py-2.5 text-sm font-bold text-[#1e3228] no-underline transition-all hover:border-[#C9F549] hover:bg-[#f3f6f1]"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Ver todas
                <ChevronRight size={16} />
              </Link>
              </div>
            </div>
            <div ref={featuredOffersTrackRef} className="czn-offer-carousel-track">
              {featuredOffers.map((offer, idx) => (
                <motion.div
                  key={offer.id}
                  className="czn-offer-slide"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <OfferCard
                    offer={offer}
                    actionLabel="Resgatar"
                    actionHref="/auth"
                    secondaryLabel="Ver detalhes"
                    variant="landing-carousel"
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Neighborhoods Strip */}
        <section>
          <div className="space-y-1 mb-5">
            <span className="czn-section-label">✦ Bairros</span>
            <h2 className="czn-section-title">Cobrindo toda a Zona Norte</h2>
          </div>
          <div className="czn-neighborhood-scroll">
            {northZoneNeighborhoods.map((n) => (
              <Link
                key={n}
                href={`/ofertas?bairro=${encodeURIComponent(n)}`}
                className="czn-neigh-pill"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                <MapPin size={13} style={{ color: "#C9F549" }} />
                {n}
              </Link>
            ))}
          </div>
        </section>

        {/* Stats Bar */}
        <section className="czn-stats-bar rounded-2xl px-6 py-10 md:px-10">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { value: "8+", label: "Bairros" },
              { value: "100+", label: "Parceiros" },
              { value: "1000+", label: "Ofertas" },
              { value: "0%", label: "Taxa de uso" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="text-center"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <p
                  className="text-4xl font-black"
                  style={{ color: "#C9F549", fontFamily: "var(--font-poppins)" }}
                >
                  {s.value}
                </p>
                <p className="text-sm text-[#9db8a8] mt-1 uppercase tracking-wide" style={{ fontFamily: "var(--font-dm)" }}>
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Instagram Feed Section */}
        <section>
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div className="space-y-1">
              <span className="czn-section-label">✦ Siga-nos</span>
              <h2 className="czn-section-title">Últimas novidades no Instagram</h2>
            </div>
            <a
              href="https://instagram.com/clubezn"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-[#dfe5d4] bg-white px-4 py-2.5 text-sm font-bold text-[#1e3228] no-underline transition-all hover:border-[#C9F549] hover:bg-[#f3f6f1]"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              @clubezn
              <ArrowRight size={16} />
            </a>
          </div>
          <div className="rounded-2xl overflow-hidden border border-[#dfe5d4] bg-white p-6">
            <iframe
              src="https://www.instagram.com/clubezn/embed"
              width="100%"
              height="600"
              frameBorder="0"
              scrolling="no"
              allowTransparency={true}
              className="w-full"
              style={{ minHeight: "400px" }}
              title="Instagram Feed ClubeZN"
            />
          </div>
        </section>

        {/* CTA Banner */}
        <motion.section
          className="rounded-2xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #C9F549 0%, #a8d63a 100%)" }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 80% 50%, rgba(16,33,19,0.3) 0%, transparent 60%)",
            }}
          />
          <div className="absolute top-4 right-4 md:top-6 md:right-6 opacity-70">
            <img
              src="/images/pig-icon.png"
              alt="Ícone porquinho"
              className="w-24 h-24 md:w-32 md:h-32 object-cover"
              loading="lazy"
            />
          </div>
          <div className="relative z-10 px-8 py-12 md:px-12 max-w-2xl">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#0a0f0c] bg-white px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#0a0f0c] mb-4"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              ✦ Comece agora
            </span>
            <h2
              className="text-3xl font-black leading-tight text-[#0a0f0c] md:text-4xl mb-3"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Pronto para descobrir ofertas reais perto de você?
            </h2>
            <p className="text-[#1f3318] mb-6" style={{ fontFamily: "var(--font-dm)" }}>
              Acesse agora e comece a economizar, ou publique sua primeira oferta como parceiro.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth?tab=login"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0a0f0c] px-6 py-3.5 font-black text-white no-underline transition-all hover:shadow-xl active:scale-95"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Entrar agora
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/auth?tab=register"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#0a0f0c] bg-white px-6 py-3.5 font-black text-[#0a0f0c] no-underline transition-all hover:bg-[#f0f5e8] active:scale-95"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Sou parceiro
              </Link>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Footer */}
      <footer className="czn-footer mt-10">
        <div className="max-w-7xl mx-auto px-4 py-12 md:px-6">
          <div className="grid gap-10 md:grid-cols-4">
            {/* Col 1: Brand */}
            <div className="md:col-span-1 space-y-4">
              <BrandLogo small />
              <p className="text-sm leading-relaxed text-[#9db8a8]" style={{ fontFamily: "var(--font-dm)" }}>
                Conectamos moradores e empresas da Zona Norte de Porto Alegre com ofertas reais e
                locais.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com/clubezn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/8 transition-all hover:border-[#C9F549] hover:text-[#C9F549]"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                  aria-label="Instagram ClubeZN"
                >
                  <Heart size={16} />
                </a>
                <a
                  href="mailto:contato@clubezn.com"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/8 transition-all hover:border-[#C9F549] hover:text-[#C9F549]"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                  aria-label="Email ClubeZN"
                >
                  <Mail size={16} />
                </a>
              </div>
            </div>

            {/* Col 2: Ofertas */}
            <div className="space-y-3">
              <p
                className="text-xs font-black uppercase tracking-[0.1em] text-white"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Ofertas
              </p>
              <ul className="space-y-2">
                {footerLinks.ofertas.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm" style={{ fontFamily: "var(--font-dm)" }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Institucional */}
            <div className="space-y-3">
              <p
                className="text-xs font-black uppercase tracking-[0.1em] text-white"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Institucional
              </p>
              <ul className="space-y-2">
                {footerLinks.institucional.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm" style={{ fontFamily: "var(--font-dm)" }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Contato */}
            <div className="space-y-3">
              <p
                className="text-xs font-black uppercase tracking-[0.1em] text-white"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Contato
              </p>
              <div className="space-y-2 text-sm" style={{ fontFamily: "var(--font-dm)" }}>
                <a href="mailto:contato@clubezn.com" className="block">
                  contato@clubezn.com
                </a>
                <div className="flex items-center gap-1.5 text-[#9db8a8]">
                  <MapPin size={13} style={{ color: "#C9F549" }} />
                  <span>Zona Norte, Porto Alegre/RS</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-[#9db8a8]" style={{ fontFamily: "var(--font-dm)" }}>
              © {new Date().getFullYear()} ClubeZN. Todos os direitos reservados.
            </p>
            <p className="text-xs text-[#9db8a8]" style={{ fontFamily: "var(--font-dm)" }}>
              Construído com foco na Zona Norte de Porto Alegre.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
