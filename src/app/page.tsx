"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  ChevronRight,
  GraduationCap,
  HeartPulse,
  PawPrint,
  Pill,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { OfferCard, type OfferCardData } from "@/components/offer-card";
import { northZoneNeighborhoodShapes, type NeighborhoodShape } from "@/lib/north-zone-map-data";
import { isSupabaseMode } from "@/lib/runtime-config";
import { getData, initStorage } from "@/lib/storage";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { Company } from "@/lib/types";
import { getHotOfferIds } from "@/lib/utils";

const categories: { title: string; subtitle: string; icon: LucideIcon }[] = [
  { title: "Supermercado", subtitle: "e compras", icon: ShoppingBasket },
  { title: "Farmacia", subtitle: "e cuidados", icon: Pill },
  { title: "Restaurantes", subtitle: "e cafes", icon: UtensilsCrossed },
  { title: "Beleza", subtitle: "e estilo", icon: Sparkles },
  { title: "Saude", subtitle: "e bem-estar", icon: HeartPulse },
  { title: "Servicos", subtitle: "locais", icon: BriefcaseBusiness },
  { title: "Pet", subtitle: "care", icon: PawPrint },
  { title: "Educacao", subtitle: "e cursos", icon: GraduationCap },
];

const headerLinks = [
  { label: "Ofertas", href: "/ofertas" },
  { label: "Parceiros", href: "#parceiros" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "FAQ", href: "#faq" },
];

const featuredPartnerLogos = [
  {
    name: "Trip Junior",
    segment: "Turismo e experiencias",
    image: "/partners/trip-junior.svg",
  },
  {
    name: "AIO Empresarial",
    segment: "Solucoes corporativas",
    image: "/partners/aio-empresarial.svg",
  },
  {
    name: "Colegio Kennedy",
    segment: "Educacao",
    image: "/partners/colegio-kennedy.svg",
  },
];

const heroPeoplePhotos = [
  "https://i.pravatar.cc/64?img=12",
  "https://i.pravatar.cc/64?img=32",
  "https://i.pravatar.cc/64?img=47",
  "https://i.pravatar.cc/64?img=56",
];

const trustTestimonials = [
  {
    author: "Ana, moradora do Sarandi",
    quote: "Em duas semanas já usei três ofertas perto de casa. O processo é simples e rápido.",
  },
  {
    author: "Carlos, Rubem Berta",
    quote: "Consegui economizar no mercado e na farmácia no mesmo mês, sem burocracia.",
  },
  {
    author: "Patrícia, Jardim Lindóia",
    quote: "Gostei porque as ofertas são locais e fáceis de validar direto no parceiro.",
  },
];

const trustBadges = ["Parceiros verificados", "Ofertas com curadoria", "Suporte local Zona Norte"];

const MAP_WIDTH = 520;
const MAP_HEIGHT = 320;
const MAP_PADDING = 16;

type LonLat = [number, number];
type PolygonRings = LonLat[][];
type MultiPolygonRings = LonLat[][][];

const getPolygons = (shape: NeighborhoodShape["geojson"]): PolygonRings[] =>
  shape.type === "Polygon"
    ? [shape.coordinates as PolygonRings]
    : (shape.coordinates as MultiPolygonRings);

const allGeoPoints: LonLat[] = northZoneNeighborhoodShapes.flatMap((shape) =>
  getPolygons(shape.geojson).flatMap((polygon) => polygon.flatMap((ring) => ring)),
);

const mapBounds = allGeoPoints.reduce(
  (acc, point) => {
    const [lon, lat] = point;
    return {
      minLon: Math.min(acc.minLon, lon),
      maxLon: Math.max(acc.maxLon, lon),
      minLat: Math.min(acc.minLat, lat),
      maxLat: Math.max(acc.maxLat, lat),
    };
  },
  { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity },
);

const mapScale = Math.min(
  (MAP_WIDTH - MAP_PADDING * 2) / (mapBounds.maxLon - mapBounds.minLon),
  (MAP_HEIGHT - MAP_PADDING * 2) / (mapBounds.maxLat - mapBounds.minLat),
);

const projectLonLat = (lon: number, lat: number) => ({
  x: MAP_PADDING + (lon - mapBounds.minLon) * mapScale,
  y: MAP_HEIGHT - MAP_PADDING - (lat - mapBounds.minLat) * mapScale,
});

const buildGeoPath = (shape: (typeof northZoneNeighborhoodShapes)[number]["geojson"]) => {
  return getPolygons(shape)
    .flatMap((polygon) =>
      polygon.map((ring) => {
        if (!ring.length) return "";
        const [firstLon, firstLat] = ring[0];
        const firstPoint = projectLonLat(firstLon, firstLat);
        const segments = ring
          .slice(1)
          .map(([lon, lat]) => {
            const point = projectLonLat(lon, lat);
            return `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
          })
          .join(" ");
        return `M ${firstPoint.x.toFixed(2)} ${firstPoint.y.toFixed(2)} ${segments} Z`;
      }),
    )
    .join(" ");
};

const northZoneMapLayout = northZoneNeighborhoodShapes.map((shape) => ({
  name: shape.name,
  path: buildGeoPath(shape.geojson),
  center: projectLonLat(shape.center.lon, shape.center.lat),
}));

const defaultNeighborhood = "Sarandi";

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getNeighborhoodByCoordinates = async (latitude: number, longitude: number) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
    {
      headers: {
        "Accept-Language": "pt-BR",
      },
    },
  );

  if (!response.ok) return "";

  const payload = (await response.json()) as {
    address?: {
      suburb?: string;
      neighbourhood?: string;
      city_district?: string;
      quarter?: string;
    };
  };

  const address = payload.address;
  if (!address) return "";
  return address.suburb ?? address.neighbourhood ?? address.city_district ?? address.quarter ?? "";
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
  category: string;
  neighborhood: string;
  city: string;
  state: string;
  approved: boolean;
  logo_image: string | null;
  cover_image: string | null;
  address_line: string | null;
  bio: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  whatsapp: string | null;
};

const mapLocalLandingData = () => {
  initStorage();
  const data = getData();
  const hotOfferIds = getHotOfferIds(data, 3);
  const approvedCompanies = new Map(
    data.companies.filter((company) => company.approved).map((company) => [company.id, company]),
  );

  const featuredOffers: OfferCardData[] = data.offers
    .filter((offer) => offer.approved && approvedCompanies.has(offer.companyId))
    .slice(0, 8)
    .map((offer) => ({
      id: offer.id,
      companyId: offer.companyId,
      title: offer.title,
      description: offer.description,
      discountLabel: offer.discountLabel,
      category: offer.category,
      neighborhood: offer.neighborhood,
      isHot: hotOfferIds.has(offer.id),
      companyName:
        approvedCompanies.get(offer.companyId)?.publicName ?? approvedCompanies.get(offer.companyId)?.name ?? "Parceiro ClubeZN",
      images: offer.images,
      partnerLogoImage: approvedCompanies.get(offer.companyId)?.logoImage,
      partnerCoverImage: approvedCompanies.get(offer.companyId)?.coverImage,
      partnerAddressLine: approvedCompanies.get(offer.companyId)?.addressLine,
      partnerInstagram: approvedCompanies.get(offer.companyId)?.instagram,
      partnerFacebook: approvedCompanies.get(offer.companyId)?.facebook,
      partnerWebsite: approvedCompanies.get(offer.companyId)?.website,
      partnerWhatsapp: approvedCompanies.get(offer.companyId)?.whatsapp,
    }));

  const partnerProfiles = data.companies.filter((company) => company.approved).slice(0, 6);
  return { featuredOffers, partnerProfiles };
};

const mapSupabaseLandingData = async () => {
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
      .select(
        "id, name, public_name, category, neighborhood, city, state, approved, logo_image, cover_image, address_line, bio, instagram, facebook, website, whatsapp",
      ),
    supabase.from("redemptions").select("offer_id, status"),
  ]);

  if (offersRes.error) throw offersRes.error;
  if (companiesRes.error) throw companiesRes.error;
  if (redemptionsRes.error) throw redemptionsRes.error;

  const offers = (offersRes.data ?? []) as SupabaseOfferRow[];
  const companies = (companiesRes.data ?? []) as SupabaseCompanyRow[];
  const redemptions = (redemptionsRes.data ?? []) as Array<{ offer_id: string; status: "generated" | "used" | "expired" }>;

  const approvedCompanies = new Map(companies.filter((company) => company.approved).map((company) => [company.id, company]));

  const usageScoreByOffer = redemptions.reduce<Record<string, number>>((acc, redemption) => {
    const score = redemption.status === "used" ? 2 : redemption.status === "generated" ? 1 : 0;
    if (score <= 0) return acc;
    acc[redemption.offer_id] = (acc[redemption.offer_id] ?? 0) + score;
    return acc;
  }, {});

  const hotOfferIds = new Set(
    Object.entries(usageScoreByOffer)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .filter(([, score]) => score > 0)
      .map(([offerId]) => offerId),
  );

  const featuredOffers: OfferCardData[] = offers
    .filter((offer) => offer.approved && !offer.rejected && approvedCompanies.has(offer.company_id))
    .slice(0, 8)
    .map((offer) => {
      const company = approvedCompanies.get(offer.company_id);
      return {
        id: offer.id,
        companyId: offer.company_id,
        title: offer.title,
        description: offer.description,
        discountLabel: offer.discount_label,
        category: offer.category,
        neighborhood: offer.neighborhood,
        isHot: hotOfferIds.has(offer.id),
        companyName: company?.public_name ?? company?.name ?? "Parceiro ClubeZN",
        images: Array.isArray(offer.images) ? offer.images : [],
        partnerLogoImage: company?.logo_image ?? undefined,
        partnerCoverImage: company?.cover_image ?? undefined,
        partnerAddressLine: company?.address_line ?? undefined,
        partnerInstagram: company?.instagram ?? undefined,
        partnerFacebook: company?.facebook ?? undefined,
        partnerWebsite: company?.website ?? undefined,
        partnerWhatsapp: company?.whatsapp ?? undefined,
      };
    });

  const partnerProfiles: Company[] = companies
    .filter((company) => company.approved)
    .slice(0, 6)
    .map((company) => ({
      id: company.id,
      name: company.name,
      publicName: company.public_name ?? undefined,
      category: company.category,
      neighborhood: company.neighborhood,
      city: company.city,
      state: company.state,
      ownerUserId: "",
      approved: company.approved,
      logoImage: company.logo_image ?? undefined,
      coverImage: company.cover_image ?? undefined,
      addressLine: company.address_line ?? undefined,
      bio: company.bio ?? undefined,
      instagram: company.instagram ?? undefined,
      facebook: company.facebook ?? undefined,
      website: company.website ?? undefined,
      whatsapp: company.whatsapp ?? undefined,
      createdAt: "",
    }));

  return { featuredOffers, partnerProfiles };
};

export default function LandingPage() {
  const categoriesScrollerRef = useRef<HTMLDivElement | null>(null);
  const [featuredOffers, setFeaturedOffers] = useState<OfferCardData[]>([]);
  const [partnerProfiles, setPartnerProfiles] = useState<Company[]>([]);
  const [offersLoadingError, setOffersLoadingError] = useState("");

  const [highlightNeighborhood, setHighlightNeighborhood] = useState(defaultNeighborhood);
  const heroImage = featuredOffers[0]?.images[0];

  useEffect(() => {
    let cancelled = false;

    const loadLandingData = async () => {
      try {
        setOffersLoadingError("");
        const mapped = isSupabaseMode ? await mapSupabaseLandingData() : mapLocalLandingData();
        if (cancelled) return;
        setFeaturedOffers(mapped.featuredOffers);
        setPartnerProfiles(mapped.partnerProfiles);
      } catch (error) {
        if (cancelled) return;
        setFeaturedOffers([]);
        setPartnerProfiles([]);
        setOffersLoadingError(error instanceof Error ? error.message : "Falha ao carregar dados.");
      }
    };

    loadLandingData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let canceled = false;

    if (!("geolocation" in navigator)) return () => undefined;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const neighborhood = await getNeighborhoodByCoordinates(position.coords.latitude, position.coords.longitude);
          if (canceled || !neighborhood.trim()) return;
          setHighlightNeighborhood(neighborhood.trim());
        } catch {
          // Keep default neighborhood when location lookup fails.
        }
      },
      () => {
        // User denied location or unavailable: keep default neighborhood.
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 30 * 60 * 1000,
      },
    );

    return () => {
      canceled = true;
    };
  }, []);

  const scrollCollections = () => {
    const container = categoriesScrollerRef.current;
    if (!container) return;
    container.scrollBy({ left: 260, behavior: "smooth" });
  };

  return (
    <main id="conteudo-principal" className="mx-auto grid min-h-screen w-full max-w-[1400px] gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-6 xl:px-8">
      <a
        href="#ofertas"
        className="sr-only rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#102113] focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[120]"
      >
        Pular para ofertas
      </a>
      <section className="grid gap-4">
        <div className="flex items-center justify-center rounded-2xl border border-[#d9e6db] bg-[#f4faf5] px-3 py-2 text-center text-xs font-semibold text-[#255f33] md:text-sm">
          Ganhe ate 25% OFF em parceiros selecionados da Zona Norte
        </div>

        <header className="rounded-2xl border border-[#d9e6db] bg-white px-3 py-2.5 md:px-4">
          <div className="flex items-center justify-between gap-3">
            <BrandLogo />

            <nav className="hidden items-center gap-6 md:flex" aria-label="Menu principal">
              {headerLinks.map((item) => (
                <a key={item.label} href={item.href} className="text-sm font-semibold text-[#2a3d2f] transition hover:text-[#1f5f30]">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link href="/auth" className="btn btn-ghost !w-auto !px-4 !py-2 text-sm">
                Entrar
              </Link>
              <Link href="/auth" className="btn btn-primary !w-auto !px-4 !py-2 text-sm">
                Comecar
              </Link>
            </div>
          </div>
        </header>

        <div className="grid gap-4 rounded-[26px] bg-[#f7faf7] p-3 md:grid-cols-[1.05fr_0.95fr] md:items-stretch md:gap-6 md:p-6">
          <article className="grid content-start gap-4">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#2b7a3f]">Zona Norte - Porto Alegre</p>
            <h1 className="m-0 text-4xl font-black leading-[0.95] text-[#102113] md:text-6xl">
              Chegamos na Zona Norte de POA!
              <span className="mt-2 block text-[0.82em] leading-[1.02] md:mt-3">
                <span className="font-extrabold text-[#1f5f30]">✚</span> descontos
                <br />
                <span className="font-extrabold text-[#1f5f30]">✚</span> vantagens
                <br />
                pra ti!
              </span>
            </h1>
            <p className="m-0 max-w-xl text-sm leading-relaxed text-[#486048] md:text-base">
              Veja ofertas por bairro, gere seu codigo em segundos e valide direto no parceiro. Tudo num fluxo simples para
              quem mora na Zona Norte.
            </p>

            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <Link href="/ofertas" className="btn btn-primary !w-full sm:!w-auto sm:min-w-44">
                Ver ofertas agora
              </Link>
              <Link href="/auth" className="btn btn-ghost !w-full sm:!w-auto sm:min-w-44">
                Quero participar
              </Link>
            </div>

            <div className="mt-1 grid gap-2">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {heroPeoplePhotos.map((photo, index) => (
                    <Image
                      key={photo}
                      src={photo}
                      alt={`Morador ${index + 1}`}
                      width={32}
                      height={32}
                      unoptimized
                      className="h-8 w-8 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>
                <p className="m-0 text-sm font-semibold text-[#1b2d1f]">200+ moradores usando o ClubeZN</p>
              </div>
              <p className="m-0 max-w-md text-xs text-[#486048] md:text-sm">
                Todo bairro tem um atalho para economizar. O ClubeZN conecta voce a ele.
              </p>
            </div>
          </article>

          <aside className="relative grid min-h-[340px] overflow-hidden rounded-[24px] border border-[#d6e7d9] bg-[linear-gradient(150deg,#e8f6eb_0%,#d4edda_60%,#c7e8d0_100%)] p-3 md:min-h-[460px] md:p-5">
            <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(#bdd8c5_1px,transparent_1px),linear-gradient(90deg,#bdd8c5_1px,transparent_1px)] [background-size:24px_24px]" />
            {heroImage ? (
              <Image
                alt="Destaque de oferta local"
                height={520}
                src={heroImage}
                unoptimized
                width={520}
                className="relative z-[1] mt-auto h-[76%] w-full rounded-2xl object-cover md:h-[80%]"
              />
            ) : (
              <div className="relative z-[1] mt-auto grid h-[76%] place-items-center rounded-2xl border border-[#bcd9c3] bg-white/50 text-sm font-bold text-[#1f5f30] md:h-[80%]">
                Sua oferta em destaque aqui
              </div>
            )}

            <article className="absolute bottom-3 left-3 z-[2] grid gap-1 rounded-2xl border border-[#dbe8de] bg-white px-3 py-2 shadow-sm md:bottom-5 md:left-5">
              <p className="m-0 text-[11px] font-semibold text-[#5d735f]">Economia no mes</p>
              <p className="m-0 text-xl font-black text-[#102113]">R$ 198,00</p>
            </article>
            <article className="absolute right-3 top-3 z-[2] grid gap-1 rounded-2xl border border-[#dbe8de] bg-white px-3 py-2 shadow-sm md:right-5 md:top-5">
              <p className="m-0 text-[11px] font-semibold text-[#5d735f]">Resgates (30 dias)</p>
              <p className="m-0 text-xl font-black text-[#102113]">+120</p>
            </article>
          </aside>
        </div>
      </section>

      <section id="categorias" className="grid gap-3 rounded-[24px] border border-[#dbdee3] bg-[#f2f4f7] p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="m-0 text-xl font-extrabold text-[#25303b] md:text-2xl">Explore nossas colecoes</h3>
          <Link href="/ofertas" className="text-sm font-bold text-[#2487ff] hover:underline">
            Ver tudo
          </Link>
        </div>
        <div className="relative">
          <div ref={categoriesScrollerRef} className="flex gap-3 overflow-x-auto pb-1 pr-12">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={`/ofertas?categoria=${encodeURIComponent(category.title)}`}
                className="grid min-w-[152px] gap-1.5 rounded-2xl border border-[#d7dce2] bg-[#f6f7f9] px-3 py-4 text-center transition hover:bg-white"
              >
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-[#d2d7de] bg-white text-[#747d87]">
                  <category.icon size={19} />
                </span>
                <p className="m-0 text-sm font-extrabold leading-tight text-[#3f4955] md:text-base">{category.title}</p>
                <p className="m-0 text-sm font-extrabold leading-tight text-[#3f4955] md:text-base">{category.subtitle}</p>
              </Link>
            ))}
          </div>
          <button
            type="button"
            aria-label="Ver mais coleções"
            onClick={scrollCollections}
            className="absolute right-0 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-[#d7dce2] bg-white text-[#2487ff] shadow-[0_6px_18px_rgba(20,35,50,0.15)] md:grid"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-[#d4e4d8] bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="m-0 text-xl font-extrabold text-[#102113] md:text-2xl">Quem usa, recomenda</h3>
          <div className="flex flex-wrap gap-2">
            {trustBadges.map((badge) => (
              <span key={badge} className="rounded-full border border-[#d1dfd1] bg-[#edf8ef] px-3 py-1 text-xs font-bold text-[#1f5f30]">
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {trustTestimonials.map((item) => (
            <article key={item.author} className="rounded-xl border border-[#dce8de] bg-[#f8fcf8] p-3">
              <p className="m-0 text-sm leading-relaxed text-[#314634]">“{item.quote}”</p>
              <p className="mt-2 mb-0 text-xs font-bold uppercase tracking-[0.06em] text-[#5b755f]">{item.author}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-[28px] border border-[#f2c97f] bg-[linear-gradient(135deg,#ffe2ad_0%,#ffd28a_55%,#ffc670_100%)] p-4 md:p-6">
        <div className="grid gap-2 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div className="grid gap-2">
            <p className="m-0 text-xs font-black uppercase tracking-[0.08em] text-[#704110]">Bairros da Zona Norte</p>
            <h3 className="m-0 text-2xl font-black leading-tight text-[#2f1a03] md:text-4xl">
              {highlightNeighborhood} ja esta no mapa do ClubeZN. Se voce mora aqui, ja pode participar.
            </h3>
            <p className="m-0 max-w-3xl text-sm text-[#5f370a] md:text-base">
              Estamos expandindo por toda a Zona Norte para conectar moradores a descontos locais. Procure seu bairro na lista e
              entre para aproveitar as ofertas.
            </p>
          </div>
          <div className="grid gap-2 md:justify-items-end">
            <Link href="/ofertas" className="btn !w-full border border-[#91520f] bg-[#2f1a03] text-white md:!w-auto md:min-w-52">
              Ver ofertas por bairro
            </Link>
            <p className="m-0 text-xs font-semibold text-[#6e4312]">Mais bairros entram em ondas de expansão contínua.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_0.9fr] md:items-stretch">
          <article className="relative overflow-hidden rounded-2xl border border-[#d8a95d] bg-[#fff5e3] p-3 md:p-4">
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#e8ba76_0.8px,transparent_0.8px)] [background-size:14px_14px]" />
            <div className="relative z-[1]">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#7f4c0f]">Mapa Zona Norte (contornos reais)</p>
              <div className="relative mt-2 rounded-xl border border-[#dcb276] bg-white/60 p-2">
                <svg
                  viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                  className="h-[220px] w-full md:h-[260px]"
                  role="img"
                  aria-label="Mapa da Zona Norte com contornos de bairros"
                >
                  <defs>
                    <linearGradient id="znMapFill" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffe0ad" />
                      <stop offset="100%" stopColor="#ffcb7d" />
                    </linearGradient>
                  </defs>
                  {northZoneMapLayout.map((shape) => {
                    const isHighlighted = normalizeText(shape.name) === normalizeText(highlightNeighborhood);
                    return (
                      <path
                        key={`${shape.name}-poly`}
                        d={shape.path}
                        fill={isHighlighted ? "#f7d6a8" : "url(#znMapFill)"}
                        stroke={isHighlighted ? "#5f3608" : "#b77527"}
                        strokeWidth={isHighlighted ? 2.4 : 1.4}
                        opacity={isHighlighted ? 1 : 0.88}
                      />
                    );
                  })}
                </svg>

                {northZoneMapLayout.map((pin, index) => {
                  const highlighted = normalizeText(pin.name) === normalizeText(highlightNeighborhood);
                  return (
                    <div
                      key={pin.name}
                      className="absolute"
                      style={{
                        left: `${(pin.center.x / MAP_WIDTH) * 100}%`,
                        top: `${(pin.center.y / MAP_HEIGHT) * 100}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <span
                        className={`absolute inline-flex h-7 w-7 animate-ping rounded-full ${
                          highlighted ? "bg-[#2f1a03]/35" : "bg-[#b16618]/25"
                        }`}
                        style={{ animationDelay: `${index * 220}ms` }}
                      />
                      <span
                        className={`relative inline-flex h-4 w-4 rounded-full border-2 border-white ${
                          highlighted ? "bg-[#2f1a03]" : "bg-[#b16618]"
                        }`}
                      />
                      <span
                        className={`absolute left-1/2 top-[120%] -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          highlighted ? "bg-[#2f1a03] text-[#f7d6a8]" : "bg-white text-[#6b3f0d]"
                        }`}
                      >
                        {pin.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>

          <article className="grid gap-2 rounded-2xl border border-[#d8a95d] bg-white/70 p-3 md:p-4">
            <p className="m-0 text-sm font-extrabold text-[#552f05]">Como funciona por bairro</p>
            <p className="m-0 text-sm text-[#6e4312]">
              Os pins mostram bairros com presença ativa na Zona Norte. Clique no bairro para abrir a vitrine já filtrada.
            </p>
            <div className="grid gap-1.5">
              {northZoneMapLayout.map((pin) => {
                const highlighted = normalizeText(pin.name) === normalizeText(highlightNeighborhood);
                return (
                  <Link
                    key={`${pin.name}-legend`}
                    href={`/ofertas?bairro=${encodeURIComponent(pin.name)}`}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                      highlighted ? "border-[#5b3307] bg-[#2f1a03] text-[#f6d8ad]" : "border-[#ddb06f] bg-white text-[#6e4312]"
                    }`}
                  >
                    {pin.name}
                  </Link>
                );
              })}
            </div>
          </article>
        </div>

      </section>

      <section id="ofertas" className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="m-0 text-xl font-bold text-[#102113] md:text-2xl">Ofertas em destaque</h3>
          <Link href="/ofertas" className="text-sm font-bold text-[#1f5f30] hover:underline">
            Ver todas
          </Link>
        </div>

        {offersLoadingError ? (
          <article className="rounded-2xl border border-[#f0c8c8] bg-[#fff2f2] px-3 py-2 text-sm text-[#7c2323]">
            Não foi possível carregar as ofertas da home. Detalhe: {offersLoadingError}
          </article>
        ) : null}

        <div className="grid grid-flow-col auto-cols-[85%] gap-3 overflow-x-auto pb-1 md:grid-flow-row md:grid-cols-4 md:auto-cols-auto md:overflow-visible">
          {featuredOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              actionHref="/auth"
              actionLabel="Quero essa oferta"
              offer={offer}
            />
          ))}
          {featuredOffers.length === 0 && (
            <p className="card">As ofertas aprovadas aparecerao aqui assim que forem publicadas.</p>
          )}
        </div>
      </section>

      <section id="como-funciona" className="grid gap-3">
        <h3 className="m-0 text-xl font-bold text-[#102113] md:text-2xl">Como funciona</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <article className="card !rounded-2xl">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#d9f0dd] text-sm font-extrabold text-[#1f5f30]">
              1
            </span>
            <h4 className="mb-1 mt-2 text-base font-extrabold text-[#102113]">Crie sua conta</h4>
            <p className="m-0 text-sm text-[#486048]">Cadastro rapido com email ou celular para entrar no ClubeZN.</p>
          </article>
          <article className="card !rounded-2xl">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#d9f0dd] text-sm font-extrabold text-[#1f5f30]">
              2
            </span>
            <h4 className="mb-1 mt-2 text-base font-extrabold text-[#102113]">Escolha a oferta</h4>
            <p className="m-0 text-sm text-[#486048]">Veja os descontos disponiveis por bairro e categoria da Zona Norte.</p>
          </article>
          <article className="card !rounded-2xl">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#d9f0dd] text-sm font-extrabold text-[#1f5f30]">
              3
            </span>
            <h4 className="mb-1 mt-2 text-base font-extrabold text-[#102113]">Resgate no parceiro</h4>
            <p className="m-0 text-sm text-[#486048]">Gere seu codigo de beneficio e valide no estabelecimento parceiro.</p>
          </article>
        </div>
      </section>

      <section id="parceiros" className="grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
        <article className="card !grid !gap-3 !rounded-2xl">
          <div className="flex items-center justify-between">
            <h3 className="m-0 text-xl font-bold text-[#102113]">Empresas parceiras</h3>
            <Link href="/auth" className="text-sm font-bold text-[#1f5f30] hover:underline">
              Quero ser parceiro
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {partnerProfiles.map((partner) => (
              <article key={partner.id} className="card !grid !gap-2 !rounded-xl !p-3 md:!w-[calc(50%-0.25rem)]">
                {partner.coverImage ? (
                  <Image
                    alt={`Capa de ${partner.publicName ?? partner.name}`}
                    height={82}
                    src={partner.coverImage}
                    unoptimized
                    width={360}
                    style={{ width: "100%", height: 82, objectFit: "cover", borderRadius: 10 }}
                  />
                ) : null}
                <div className="flex items-center gap-2">
                  {partner.logoImage ? (
                    <Image
                      alt={`Logo de ${partner.publicName ?? partner.name}`}
                      height={36}
                      src={partner.logoImage}
                      unoptimized
                      width={36}
                      style={{ width: 36, height: 36, borderRadius: 999, objectFit: "cover", border: "1px solid var(--line)" }}
                    />
                  ) : null}
                  <p className="m-0 text-sm font-bold text-[#1f5f30]">{partner.publicName ?? partner.name}</p>
                </div>
                <p className="m-0 text-xs text-[#486048]">
                  {partner.addressLine || `${partner.neighborhood} - ${partner.city}/${partner.state}`}
                </p>
                <p className="m-0 text-xs text-[#486048]">
                  {[partner.instagram, partner.facebook, partner.website, partner.whatsapp].filter(Boolean).join(" • ") ||
                    "Redes não informadas"}
                </p>
                <Link href={`/parceiros/${partner.id}`} className="text-xs font-bold text-[#1f5f30] hover:underline">
                  Ver perfil da empresa
                </Link>
              </article>
            ))}
            {partnerProfiles.length === 0 && (
              <span className="rounded-xl border border-[#d1dfd1] bg-white px-3 py-2 text-sm font-semibold text-[#1f5f30]">
                Sua empresa pode ser a primeira
              </span>
            )}
          </div>
        </article>

        <article className="card !grid !gap-3 !rounded-2xl !bg-[#edf8ef]">
          <h3 className="m-0 text-xl font-extrabold text-[#102113]">Pronto para economizar no seu bairro?</h3>
          <p className="m-0 text-sm text-[#486048]">Entre agora no ClubeZN e comece a usar os descontos locais.</p>
          <Link href="/auth" className="btn btn-primary !w-full text-center">
            Entrar no ClubeZN
          </Link>
        </article>
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="m-0 text-xl font-bold text-[#102113] md:text-2xl">Empresas parceiras em destaque</h3>
          <Link href="/auth" className="text-sm font-bold text-[#1f5f30] hover:underline">
            Quero minha marca aqui
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {featuredPartnerLogos.map((partner) => (
            <article key={partner.name} className="card !grid !gap-2 !rounded-2xl">
              <div className="grid place-items-center rounded-xl border border-[#d1dfd1] bg-[#f8fbf8] p-2">
                <Image
                  src={partner.image}
                  alt={`Logomarca ${partner.name}`}
                  width={300}
                  height={160}
                  unoptimized
                  style={{ width: "100%", height: 160, objectFit: "contain" }}
                />
              </div>
              <p className="m-0 text-base font-extrabold text-[#102113]">{partner.name}</p>
              <p className="m-0 text-sm text-[#486048]">{partner.segment}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="card !grid !gap-2 !rounded-2xl">
        <h3 className="m-0 text-lg font-extrabold text-[#102113]">Perguntas frequentes</h3>
        <p className="m-0 text-sm text-[#1f5f30]"><strong>Precisa pagar?</strong> Nao. O uso e gratuito neste MVP.</p>
        <p className="m-0 text-sm text-[#1f5f30]"><strong>Como resgatar?</strong> Gere codigo de 6 digitos e valide no parceiro.</p>
        <p className="m-0 text-sm text-[#1f5f30]"><strong>Quem pode usar?</strong> Moradores da Zona Norte de Porto Alegre.</p>
      </section>

      <footer className="grid gap-5 rounded-[28px] border border-[#25432f] bg-[#102113] p-5 text-[#d7e8db] md:p-8">
        <div className="grid gap-5 border-b border-[#294735] pb-5 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="grid gap-2">
            <BrandLogo />
            <p className="m-0 max-w-xl text-sm leading-relaxed text-[#b7cdbd]">
              ClubeZN e a plataforma de vantagens da Zona Norte de Porto Alegre, conectando moradores a parceiros locais com
              resgate simples e seguro.
            </p>
          </div>
          <div className="grid gap-2 rounded-2xl border border-[#2f5440] bg-[#183426] p-4 md:justify-self-end">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#9fc6ab]">Central de atendimento</p>
            <p className="m-0 text-sm font-semibold">contato@clubezn.com</p>
            <p className="m-0 text-sm font-semibold">WhatsApp: (51) 99999-0000</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="grid content-start gap-2">
            <p className="m-0 text-sm font-extrabold text-white">Empresa</p>
            <a href="#como-funciona" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Como funciona</a>
            <a href="#parceiros" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Parceiros</a>
            <a href="#faq" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Perguntas frequentes</a>
          </div>

          <div className="grid content-start gap-2">
            <p className="m-0 text-sm font-extrabold text-white">Plataforma</p>
            <Link href="/ofertas" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Ofertas</Link>
            <Link href="/auth" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Criar conta</Link>
            <Link href="/auth" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Entrar</Link>
          </div>

          <div className="grid content-start gap-2">
            <p className="m-0 text-sm font-extrabold text-white">Links uteis</p>
            <a href="#" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Seja parceiro</a>
            <a href="#" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Fale com suporte</a>
            <a href="#" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Status da plataforma</a>
          </div>

          <div className="grid content-start gap-2">
            <p className="m-0 text-sm font-extrabold text-white">Legal</p>
            <a href="#" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Termos de uso</a>
            <a href="#" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Privacidade</a>
            <a href="#" className="text-sm text-[#b7cdbd] no-underline hover:text-white">LGPD</a>
          </div>

          <div className="grid content-start gap-2">
            <p className="m-0 text-sm font-extrabold text-white">Redes sociais</p>
            <a href="#" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Instagram</a>
            <a href="#" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Facebook</a>
            <a href="#" className="text-sm text-[#b7cdbd] no-underline hover:text-white">LinkedIn</a>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#294735] pt-4 text-xs text-[#9fb9a7]">
          <p className="m-0">© 2026 ClubeZN. Todos os direitos reservados.</p>
          <p className="m-0">Porto Alegre/RS • Zona Norte</p>
        </div>
      </footer>
    </main>
  );
}
