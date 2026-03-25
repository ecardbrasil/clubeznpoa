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
import { getHotOfferIds, getHotOfferIdsFromSupabase } from "@/lib/utils";

const categories: { title: string; subtitle: string; icon: LucideIcon }[] = [
  { title: "Supermercado", subtitle: "e compras", icon: ShoppingBasket },
  { title: "Farmácia", subtitle: "e cuidados", icon: Pill },
  { title: "Restaurantes", subtitle: "e cafés", icon: UtensilsCrossed },
  { title: "Beleza", subtitle: "e estilo", icon: Sparkles },
  { title: "Saúde", subtitle: "e bem-estar", icon: HeartPulse },
  { title: "Serviços", subtitle: "locais", icon: BriefcaseBusiness },
  { title: "Pet", subtitle: "care", icon: PawPrint },
  { title: "Educação", subtitle: "e cursos", icon: GraduationCap },
];

const headerLinks = [
  { label: "Ofertas", href: "/ofertas" },
  { label: "Parceiros", href: "#parceiros" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "FAQ", href: "#faq" },
];

const heroPeoplePhotos = [
  "https://i.pravatar.cc/64?img=12",
  "https://i.pravatar.cc/64?img=32",
  "https://i.pravatar.cc/64?img=47",
  "https://i.pravatar.cc/64?img=56",
];

const howItWorksSteps = [
  {
    step: "01",
    title: "Cadastre-se em menos de 2 minutos",
    description: "Crie sua conta com e-mail ou telefone e já acesse a vitrine de ofertas da Zona Norte.",
  },
  {
    step: "02",
    title: "Escolha uma oferta por bairro e categoria",
    description: "Filtre por tipo de comércio e encontre benefícios perto de você.",
  },
  {
    step: "03",
    title: "Gere o código do benefício",
    description: "Com um clique, seu código é criado na hora para apresentar no parceiro.",
  },
  {
    step: "04",
    title: "Valide no estabelecimento",
    description: "Mostre o código no caixa ou atendimento e confirme o resgate.",
  },
  {
    step: "05",
    title: "Acompanhe novas vantagens",
    description: "Volte sempre para descobrir novas ofertas e parceiros cadastrados.",
  },
];

const faqItems = [
  {
    question: "O ClubeZN tem custo para o morador?",
    answer:
      "Não. O acesso e o uso da plataforma são gratuitos para moradores. Você cria sua conta e já pode visualizar e resgatar ofertas disponíveis.",
  },
  {
    question: "Como faço para resgatar um desconto?",
    answer:
      "Escolha a oferta, clique em gerar código e apresente esse código no parceiro participante. A validação é feita no momento do atendimento.",
  },
  {
    question: "As ofertas são válidas em toda Porto Alegre?",
    answer:
      "Neste momento, o foco está na Zona Norte de Porto Alegre. As ofertas exibidas são organizadas por bairro para facilitar o uso local.",
  },
  {
    question: "Sou empresa. Como entro na plataforma?",
    answer:
      "Faça o cadastro como parceiro, complete o perfil da empresa e publique suas ofertas. Após aprovação, sua empresa aparece para os moradores.",
  },
  {
    question: "Posso usar mais de uma oferta por dia?",
    answer:
      "Depende das regras definidas por cada parceiro. Verifique os detalhes de cada oferta antes de gerar o código de resgate.",
  },
  {
    question: "O que acontece se meu código expirar?",
    answer:
      "Basta gerar um novo código na plataforma, desde que a oferta continue ativa e disponível no momento da solicitação.",
  },
];

const trustTestimonials = [
  {
    name: "Ana P.",
    neighborhood: "Passo d'Areia",
    quote:
      "Adorei! Já usei o desconto no petshop aqui do bairro e economizei uma grana na ração. Toda ajuda no orçamento de casa é bem-vinda. Recomendo demais.",
  },
  {
    name: "Roberto C.",
    neighborhood: "São João",
    quote:
      "No início fiquei desconfiado por ser grátis, mas me surpreendi. Já economizei na farmácia e até na padaria. Hoje uso toda semana.",
  },
  {
    name: "Lucas T.",
    neighborhood: "Jardim Lindóia",
    quote:
      "Usei para um happy hour com os amigos e o desconto já valeu a noite. É simples, rápido e funciona de verdade no parceiro.",
  },
  {
    name: "Mariana S.",
    neighborhood: "Sarandi",
    quote:
      "Fui procurar serviço para o carro e encontrei oficina parceira perto de casa. Fechei na hora e ainda paguei menos.",
  },
  {
    name: "João V.",
    neighborhood: "Vila Ipiranga",
    quote:
      "O que mais gostei foi a variedade. Em um mês consegui usar em mercado, restaurante e farmácia, tudo aqui na Zona Norte.",
  },
  {
    name: "Carla M.",
    neighborhood: "Cristo Redentor",
    quote:
      "A plataforma é clara e objetiva. Entrei, escolhi a oferta e resgatei sem dificuldade. Excelente para organizar o orçamento.",
  },
];

const trustBadges = ["Parceiros verificados", "Ofertas com curadoria", "Suporte local Zona Norte"];

const getInitials = (fullName: string) =>
  fullName
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
  const approvedOffers = data.offers.filter((offer) => offer.approved && !offer.rejected);
  const approvedCompanies = data.companies.filter((company) => company.approved);
  const companiesById = new Map(approvedCompanies.map((company) => [company.id, company]));
  const offerCountByCompanyId = approvedOffers.reduce<Record<string, number>>((acc, offer) => {
    acc[offer.companyId] = (acc[offer.companyId] ?? 0) + 1;
    return acc;
  }, {});

  const featuredOffers: OfferCardData[] = data.offers
    .filter((offer) => offer.approved && !offer.rejected && companiesById.has(offer.companyId))
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
        companiesById.get(offer.companyId)?.publicName ?? companiesById.get(offer.companyId)?.name ?? "Parceiro ClubeZN",
      images: offer.images,
      partnerLogoImage: companiesById.get(offer.companyId)?.logoImage,
      partnerCoverImage: companiesById.get(offer.companyId)?.coverImage,
      partnerAddressLine: companiesById.get(offer.companyId)?.addressLine,
      partnerInstagram: companiesById.get(offer.companyId)?.instagram,
      partnerFacebook: companiesById.get(offer.companyId)?.facebook,
      partnerWebsite: companiesById.get(offer.companyId)?.website,
      partnerWhatsapp: companiesById.get(offer.companyId)?.whatsapp,
    }));

  const partnerProfiles = approvedCompanies
    .sort((a, b) => {
      const offersDiff = (offerCountByCompanyId[b.id] ?? 0) - (offerCountByCompanyId[a.id] ?? 0);
      if (offersDiff !== 0) return offersDiff;
      return (a.publicName ?? a.name).localeCompare(b.publicName ?? b.name, "pt-BR");
    })
    .slice(0, 18);
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

  const companiesById = new Map(companies.map((company) => [company.id, company]));

  const hotOfferIds = getHotOfferIdsFromSupabase(redemptions, 3);

  const featuredOffers: OfferCardData[] = offers
    .filter((offer) => offer.approved && !offer.rejected && companiesById.has(offer.company_id))
    .slice(0, 8)
    .map((offer) => {
      const company = companiesById.get(offer.company_id);
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

  const offerCountByCompanyId = offers
    .filter((offer) => offer.approved && !offer.rejected)
    .reduce<Record<string, number>>((acc, offer) => {
      acc[offer.company_id] = (acc[offer.company_id] ?? 0) + 1;
      return acc;
    }, {});

  const partnerProfiles: Company[] = companies
    .filter((company) => company.approved)
    .sort((a, b) => {
      const offersDiff = (offerCountByCompanyId[b.id] ?? 0) - (offerCountByCompanyId[a.id] ?? 0);
      if (offersDiff !== 0) return offersDiff;
      return (a.public_name ?? a.name).localeCompare(b.public_name ?? b.name, "pt-BR");
    })
    .slice(0, 18)
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
  const heroImage = "/hero/hero-clubezn.avif";

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
    <main id="conteudo-principal" className="mx-auto grid min-h-screen w-full max-w-[1400px] gap-5 px-4 py-5 md:gap-7 md:px-6 md:py-7 xl:px-8">
      <a
        href="#ofertas"
        className="sr-only rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#102113] focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[120]"
      >
        Pular para ofertas
      </a>
      <section className="grid gap-5">
        <div className="flex items-center justify-center rounded-2xl border border-[#a4c83a] bg-[var(--brand-accent)] px-4 py-2.5 text-center text-xs font-semibold text-[#102113] md:text-sm">
          Ganhe até 25% OFF em parceiros selecionados da Zona Norte
        </div>

        <header className="rounded-2xl border border-[#d9e6db] bg-white px-3 py-3 md:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BrandLogo />

            <nav className="hidden items-center gap-6 md:flex" aria-label="Menu principal">
              {headerLinks.map((item) => (
                <a key={item.label} href={item.href} className="text-sm font-semibold text-[#2a3d2f] transition hover:text-[#1f5f30]">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Link href="/auth" className="btn btn-ghost !w-full sm:!w-auto !px-4 !py-2 text-sm text-center">
                Já tenho conta
              </Link>
              <Link href="/auth" className="btn btn-primary !w-full sm:!w-auto !px-4 !py-2 text-sm text-center">
                cadastro
              </Link>
            </div>
          </div>
        </header>

        <div className="grid gap-5 rounded-[26px] bg-[#f7faf7] p-4 md:grid-cols-[1.05fr_0.95fr] md:items-stretch md:gap-7 md:p-7">
          <article className="grid content-start gap-5">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#2b7a3f]">Zona Norte - Porto Alegre</p>
            <h1 className="m-0 text-[2.1rem] font-black leading-[0.95] text-[#102113] md:text-6xl">
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
              Veja ofertas por bairro, gere seu código em segundos e valide direto no parceiro. Tudo num fluxo simples para
              quem mora na Zona Norte.
            </p>

            <div className="grid gap-2.5 sm:flex sm:flex-wrap">
              <Link href="/ofertas" className="btn btn-primary !w-full sm:!w-auto sm:min-w-44">
                Ver ofertas agora
              </Link>
              <Link href="/auth" className="btn btn-ghost !w-full sm:!w-auto sm:min-w-44">
                Quero participar
              </Link>
            </div>

            <div className="mt-1 grid gap-2.5">
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
                Todo bairro tem um atalho para economizar. O ClubeZN conecta você a ele.
              </p>
            </div>
          </article>

          <aside className="relative grid min-h-[320px] overflow-hidden rounded-[24px] border border-[#d6e7d9] bg-[linear-gradient(150deg,#e8f6eb_0%,#d4edda_60%,#c7e8d0_100%)] p-3 md:min-h-[460px] md:p-5">
            <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(#bdd8c5_1px,transparent_1px),linear-gradient(90deg,#bdd8c5_1px,transparent_1px)] [background-size:24px_24px]" />
            {heroImage ? (
              <Image
                alt="Destaque de oferta local"
                height={520}
                src={heroImage}
                width={520}
                priority
                sizes="(min-width: 768px) 45vw, 92vw"
                className="relative z-[1] mt-auto h-[76%] w-full rounded-2xl object-cover md:h-[80%]"
              />
            ) : (
              <div className="relative z-[1] mt-auto grid h-[76%] place-items-center rounded-2xl border border-[#bcd9c3] bg-white/50 text-sm font-bold text-[#1f5f30] md:h-[80%]">
                Sua oferta em destaque aqui
              </div>
            )}

            <article className="absolute bottom-2 left-2 z-[2] grid gap-1 rounded-2xl border border-[#dbe8de] bg-white px-2.5 py-2 shadow-sm md:bottom-5 md:left-5 md:px-3">
              <p className="m-0 text-[11px] font-semibold text-[#5d735f]">Economia no mês</p>
              <p className="m-0 text-xl font-black text-[#102113]">R$ 198,00</p>
            </article>
            <article className="absolute right-2 top-2 z-[2] grid gap-1 rounded-2xl border border-[#dbe8de] bg-white px-2.5 py-2 shadow-sm md:right-5 md:top-5 md:px-3">
              <p className="m-0 text-[11px] font-semibold text-[#5d735f]">Resgates (30 dias)</p>
              <p className="m-0 text-xl font-black text-[#102113]">+120</p>
            </article>
          </aside>
        </div>
      </section>

      <section id="categorias" className="grid gap-4 rounded-[24px] border border-[#dbdee3] bg-[#f2f4f7] p-5 md:p-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="m-0 text-lg font-extrabold text-[#25303b] md:text-2xl">Explore nossas coleções</h3>
          <Link href="/ofertas" className="text-sm font-bold text-[#2487ff] hover:underline">
            Ver tudo
          </Link>
        </div>
        <div className="relative">
          <div ref={categoriesScrollerRef} className="flex gap-3 overflow-x-auto pb-1 pr-8 md:pr-12">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={`/ofertas?categoria=${encodeURIComponent(category.title)}`}
                className="grid min-w-[140px] gap-1.5 rounded-2xl border border-[#d7dce2] bg-[#f6f7f9] px-3 py-4 text-center transition hover:bg-white md:min-w-[152px]"
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

      <section id="ofertas" className="grid gap-4">
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

        <div className="grid grid-flow-col auto-cols-[88%] gap-3 overflow-x-auto pb-1 md:grid-flow-row md:grid-cols-4 md:auto-cols-auto md:overflow-visible">
          {featuredOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              actionHref="/auth"
              actionLabel="Quero essa oferta"
              offer={offer}
            />
          ))}
          {featuredOffers.length === 0 && (
            <p className="card">As ofertas aprovadas aparecerão aqui assim que forem publicadas.</p>
          )}
        </div>
      </section>

      <section className="rounded-[30px] bg-[linear-gradient(140deg,#173b20_0%,#1f5f30_55%,#2b7a3f_100%)] p-3 md:p-5">
        <div className="grid gap-5 rounded-[24px] border border-[#a4c83a] bg-white p-4 md:gap-6 md:p-7">
          <div className="grid justify-items-center gap-3 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#91b730] bg-[#102113] px-3 py-1 text-xs font-semibold text-[#eefbc7]">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-accent)] text-[10px] font-black text-[#102113]">
                ★
              </span>
              Avaliado por moradores da Zona Norte
            </span>
            <h3 className="m-0 max-w-3xl text-2xl font-black leading-tight text-[#102113] md:text-4xl">
              A confiança de quem faz a Zona Norte acontecer.
            </h3>
            <p className="m-0 max-w-3xl text-sm text-[#38503e] md:text-base">
              Nossa rede de parceiros não para de crescer, unindo desde o café da sua rua preferida até marcas que você já
              conhece e confia.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {trustBadges.map((badge) => (
                <span key={badge} className="rounded-full border border-[#8eac2d] bg-[#efffbd] px-3 py-1 text-xs font-bold text-[#17301b]">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {trustTestimonials.map((item) => (
              <article key={`${item.name}-${item.neighborhood}`} className="grid gap-3 rounded-2xl border border-[#d8e7dc] bg-[#f8fcf8] p-4">
                <p className="m-0 text-3xl font-black leading-none text-[#2b7a3f]">“</p>
                <p className="m-0 -mt-2 text-sm leading-relaxed text-[#2f4535]">{item.quote}</p>
                <div className="mt-1 flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#a4c83a] bg-[var(--brand-accent)] text-xs font-black text-[#102113]">
                    {getInitials(item.name)}
                  </span>
                  <div className="grid gap-0.5">
                    <p className="m-0 text-sm font-extrabold text-[#102113]">{item.name}</p>
                    <p className="m-0 text-xs font-semibold text-[#5a735f]">Morador(a) do {item.neighborhood}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 rounded-[28px] border border-[#f2c97f] bg-[linear-gradient(135deg,#ffe2ad_0%,#ffd28a_55%,#ffc670_100%)] p-5 md:p-7">
        <div className="grid gap-2 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div className="grid gap-2">
            <p className="m-0 text-xs font-black uppercase tracking-[0.08em] text-[#704110]">Bairros da Zona Norte</p>
            <h3 className="m-0 text-2xl font-black leading-tight text-[#2f1a03] md:text-4xl">
              {highlightNeighborhood} já está no mapa do ClubeZN. Se você mora aqui, já pode participar.
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
              <div className="relative mt-2 overflow-hidden rounded-xl border border-[#dcb276] bg-white/60 p-2">
                <svg
                  viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                  className="h-[200px] w-full md:h-[260px]"
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
                        className={`absolute left-1/2 top-[120%] hidden -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold md:block ${
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

      <section
        id="como-funciona"
        className="grid gap-5 rounded-[26px] border border-[#d3e6d7] bg-[linear-gradient(135deg,#f3fbf5_0%,#ecf8ef_55%,#e6f4ea_100%)] p-5 md:gap-6 md:p-7"
      >
        <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
          <div className="grid gap-2">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#2b7a3f]">Passo a passo</p>
            <h3 className="m-0 text-2xl font-black text-[#102113] md:text-4xl">Como funciona o ClubeZN na prática</h3>
            <p className="m-0 max-w-3xl text-sm text-[#486048] md:text-base">
              Processo simples, rápido e focado em economia local. Em poucos passos você já usa vantagens no seu bairro.
            </p>
          </div>
          <Link href="/auth" className="btn btn-primary !w-full md:!w-auto md:min-w-48">
            Começar agora
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {howItWorksSteps.map((item) => (
            <article key={item.step} className="grid gap-2 rounded-2xl border border-[#cde3d2] bg-white p-4">
              <span className="inline-flex w-fit items-center justify-center rounded-full border border-[#b6d8bd] bg-[#eaf7ee] px-2.5 py-1 text-xs font-black text-[#1f5f30]">
                Etapa {item.step}
              </span>
              <h4 className="m-0 text-base font-extrabold text-[#102113]">{item.title}</h4>
              <p className="m-0 text-sm text-[#486048]">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="parceiros" className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
        <article className="card !grid !gap-3 !rounded-2xl">
          <div className="flex items-center justify-between">
            <h3 className="m-0 text-xl font-bold text-[#102113]">Empresas parceiras</h3>
            <div className="flex items-center gap-3">
              <Link href="/parceiros" className="text-sm font-bold text-[#1f5f30] hover:underline">
                Ver todas
              </Link>
              <Link href="/auth" className="text-sm font-bold text-[#1f5f30] hover:underline">
                Quero ser parceiro
              </Link>
            </div>
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
                <p className="m-0 break-words text-xs text-[#486048]">
                  {partner.addressLine || `${partner.neighborhood} - ${partner.city}/${partner.state}`}
                </p>
                <p className="m-0 break-all text-xs text-[#486048]">
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

        <article className="card !grid !gap-3 !rounded-2xl !border-[#a4c83a] !bg-[var(--brand-accent)]">
          <h3 className="m-0 text-xl font-extrabold text-[#102113]">Pronto para economizar no seu bairro?</h3>
          <p className="m-0 text-sm text-[#486048]">Entre agora no ClubeZN e comece a usar os descontos locais.</p>
          <Link href="/auth" className="btn btn-primary !w-full text-center">
            Entrar no ClubeZN
          </Link>
        </article>
      </section>

      <section className="grid gap-4 rounded-2xl border border-[#d9dddf] bg-[#f1f2f3] p-4 md:p-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="m-0 text-xl font-bold text-[#1e1f22] md:text-2xl">Empresas parceiras cadastradas</h3>
          <div className="flex items-center gap-3">
            <Link href="/parceiros" className="text-sm font-bold text-[#38424f] hover:underline">
              Ver todas
            </Link>
            <Link href="/auth" className="text-sm font-bold text-[#38424f] hover:underline">
              Quero minha marca aqui
            </Link>
          </div>
        </div>
        <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] gap-3 overflow-x-auto pb-1 md:grid-flow-row md:grid-cols-3 md:overflow-visible lg:grid-cols-5">
          {partnerProfiles.slice(0, 10).map((partner) => (
            <article
              key={partner.id}
              className="relative flex items-center gap-3 rounded-xl border border-[#cfd3d7] bg-[#f6f7f8] px-4 py-3.5 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
            >
              <span className="absolute right-2.5 top-2 text-xs font-black text-[#ef5656]">✹</span>
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-[#d4d7db] bg-white p-2">
                {partner.logoImage ? (
                  <Image
                    src={partner.logoImage}
                    alt={`Logomarca ${partner.publicName ?? partner.name}`}
                    width={52}
                    height={52}
                    unoptimized
                    style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 999 }}
                  />
                ) : (
                  <span className="text-base font-black text-[#1e1f22]">
                    {(partner.publicName ?? partner.name).trim()[0]?.toUpperCase() ?? "P"}
                  </span>
                )}
              </div>
              <div className="grid min-w-0">
                <p className="m-0 truncate text-[1.04rem] font-semibold leading-tight text-[#202328]">
                  {partner.publicName ?? partner.name}
                </p>
                <p className="m-0 truncate text-sm text-[#7c838d]">{partner.category}</p>
              </div>
            </article>
          ))}
          {partnerProfiles.length === 0 && (
            <article className="rounded-xl border border-[#cfd3d7] bg-white px-4 py-3 text-sm font-semibold text-[#38424f]">
              As empresas cadastradas aparecerão aqui.
            </article>
          )}
        </div>
      </section>

      <section id="faq" className="grid gap-4 rounded-[24px] border border-[#d6e7d9] bg-[#f7fbf8] p-5 md:p-6">
        <div className="grid gap-1">
          <h3 className="m-0 text-xl font-black text-[#102113] md:text-2xl">Perguntas frequentes</h3>
          <p className="m-0 text-sm text-[#486048]">Dúvidas mais comuns de moradores e empresas parceiras.</p>
        </div>
        <div className="grid gap-2">
          {faqItems.map((item) => (
            <details key={item.question} className="rounded-xl border border-[#d5e4d8] bg-white px-4 py-3">
              <summary className="cursor-pointer text-sm font-extrabold text-[#19321f]">{item.question}</summary>
              <p className="m-0 mt-2 text-sm leading-relaxed text-[#486048]">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="grid gap-6 rounded-[28px] border border-[#25432f] bg-[#102113] p-5 text-[#d7e8db] md:p-8">
        <div className="grid gap-5 border-b border-[#294735] pb-5 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="grid gap-2">
            <BrandLogo />
            <p className="m-0 max-w-xl text-sm leading-relaxed text-[#b7cdbd]">
              ClubeZN é a plataforma de vantagens da Zona Norte de Porto Alegre, conectando moradores a parceiros locais com
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
            <p className="m-0 text-sm font-extrabold text-white">Links úteis</p>
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
