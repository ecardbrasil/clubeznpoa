"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  HeartPulse,
  MapPinned,
  PawPrint,
  Pill,
  ScanSearch,
  ShoppingBasket,
  ShieldCheck,
  Sparkles,
  Users,
  UtensilsCrossed,
  Wallet,
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

const heroStats = [
  { value: "100%", label: "gratuito para moradores" },
  { value: "2 min", label: "para criar a conta" },
  { value: "Local", label: "benefícios por bairro" },
];

const credibilityPillars = [
  {
    title: "Parceiros verificados",
    description: "Empresas aprovadas com perfil público, endereço e canais visíveis para o morador.",
    icon: ShieldCheck,
  },
  {
    title: "Resgate simples",
    description: "Você escolhe a oferta, gera o código e valida direto no atendimento, sem burocracia.",
    icon: ScanSearch,
  },
  {
    title: "Economia próxima de casa",
    description: "A vitrine prioriza a Zona Norte para transformar desconto em conveniência real.",
    icon: Wallet,
  },
];

const partnerHighlights = [
  "Perfis públicos com dados da empresa",
  "Ofertas organizadas por categoria e bairro",
  "Experiência pensada para morador e comércio local",
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

  return (
    <main id="conteudo-principal" className="mx-auto grid min-h-screen w-full max-w-[1380px] gap-6 px-4 py-5 md:gap-8 md:px-6 md:py-7 xl:px-8">
      <a
        href="#ofertas"
        className="sr-only rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#102113] focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[120]"
      >
        Pular para ofertas
      </a>
      <section className="grid gap-5">
        <div className="flex items-center justify-center rounded-full border border-[#cad792] bg-[var(--brand-accent)]/55 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-[#1a291f] md:text-sm">
          Plataforma local de vantagens para moradores e empresas da Zona Norte de Porto Alegre
        </div>

        <header className="rounded-[28px] border border-[var(--line)] bg-white/92 px-4 py-4 shadow-[var(--shadow-soft)] backdrop-blur md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <BrandLogo />

            <nav className="hidden items-center gap-7 md:flex" aria-label="Menu principal">
              {headerLinks.map((item) => (
                <a key={item.label} href={item.href} className="text-sm font-semibold text-[#334139] transition hover:text-[var(--brand)]">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Link href="/auth" className="btn btn-ghost !w-full sm:!w-auto !px-5 !py-2.5 text-sm text-center">
                Já tenho conta
              </Link>
              <Link href="/auth" className="btn btn-primary !w-full sm:!w-auto !px-5 !py-2.5 text-sm text-center">
                Criar cadastro
              </Link>
            </div>
          </div>
        </header>

        <div className="grid gap-5 rounded-[34px] border border-[var(--line)] bg-[linear-gradient(135deg,#fffdfa_0%,#f5efe2_52%,#ece5d8_100%)] p-5 shadow-[var(--shadow-strong)] md:grid-cols-[1.05fr_0.95fr] md:items-stretch md:gap-8 md:p-8">
          <article className="grid content-start gap-6">
            <div className="grid gap-3">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d9d2c2] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#405046]">
                <BadgeCheck size={14} className="text-[var(--brand)]" />
                Curadoria local e operação simples
              </span>
              <div className="grid gap-4">
                <h1 className="font-display m-0 max-w-3xl text-[2.8rem] leading-[0.9] text-[#18231c] md:text-[4.8rem]">
                  Economia de bairro com cara de marca séria, clara e confiável.
                </h1>
                <p className="m-0 max-w-2xl text-base leading-relaxed text-[var(--muted)] md:text-lg">
                  O ClubeZN organiza ofertas reais da Zona Norte em uma experiência direta: você encontra por categoria ou
                  bairro, entende a regra rápido e resgata sem fricção.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <Link href="/ofertas" className="btn btn-primary !w-full sm:!w-auto sm:min-w-52">
                Ver ofertas agora
              </Link>
              <Link href="/auth" className="btn btn-ghost !w-full sm:!w-auto sm:min-w-44">
                Criar conta grátis
              </Link>
            </div>

            <div className="grid gap-4 rounded-[26px] border border-[#ddd5c8] bg-white/85 p-4 md:grid-cols-[auto_1fr] md:items-center">
              <div className="flex -space-x-2">
                {heroPeoplePhotos.map((photo, index) => (
                  <Image
                    key={photo}
                    src={photo}
                    alt={`Morador ${index + 1}`}
                    width={40}
                    height={40}
                    unoptimized
                    className="h-10 w-10 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <div className="grid gap-1">
                <p className="m-0 text-sm font-bold text-[#223128]">Moradores usam a plataforma para economizar perto de casa.</p>
                <p className="m-0 text-sm text-[var(--muted)]">
                  Mais clareza para o consumidor, mais visibilidade para o comércio local.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {heroStats.map((item) => (
                <article key={item.label} className="rounded-[24px] border border-[#d8d1c5] bg-[#f8f5ee] px-4 py-4">
                  <p className="m-0 text-3xl font-black text-[#18231c]">{item.value}</p>
                  <p className="m-0 mt-1 text-sm text-[var(--muted)]">{item.label}</p>
                </article>
              ))}
            </div>
          </article>

          <aside className="relative grid min-h-[420px] overflow-hidden rounded-[30px] border border-[#d3cabd] bg-[#22362a] p-4 text-white md:p-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(210,233,113,0.28),transparent_30%),linear-gradient(160deg,rgba(255,255,255,0.06),transparent_48%)]" />
            <div className="relative z-[1] flex items-start justify-between gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">
                <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">Economia estimada</p>
                <p className="m-0 mt-1 text-2xl font-black">R$ 198/mês</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-right backdrop-blur">
                <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">Resgates recentes</p>
                <p className="m-0 mt-1 text-2xl font-black">+120</p>
              </div>
            </div>

            <div className="relative z-[1] mt-4 overflow-hidden rounded-[28px] border border-white/10 bg-white/8 p-3 backdrop-blur">
              {heroImage ? (
                <Image
                  alt="Destaque de oferta local"
                  height={620}
                  src={heroImage}
                  width={620}
                  priority
                  sizes="(min-width: 768px) 45vw, 92vw"
                  className="h-[260px] w-full rounded-[22px] object-cover md:h-[310px]"
                />
              ) : (
                <div className="grid h-[260px] place-items-center rounded-[22px] border border-white/15 bg-white/10 text-sm font-bold text-white/80 md:h-[310px]">
                  Sua oferta em destaque aqui
                </div>
              )}
            </div>

            <div className="relative z-[1] mt-auto grid gap-3 md:grid-cols-3">
              {credibilityPillars.map((item) => (
                <article key={item.title} className="rounded-[22px] border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <item.icon size={18} className="text-[var(--brand-accent)]" />
                  <p className="m-0 mt-3 text-sm font-bold">{item.title}</p>
                  <p className="m-0 mt-1 text-sm leading-relaxed text-white/72">{item.description}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section id="categorias" className="grid gap-5 rounded-[30px] border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-soft)] md:p-7">
        <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
          <div className="grid gap-2">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Navegação rápida</p>
            <h2 className="font-display m-0 text-3xl leading-tight text-[#18231c] md:text-4xl">Escolha por categoria sem se perder.</h2>
            <p className="m-0 max-w-2xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
              A estrutura da home foi organizada para reduzir ruído visual e facilitar a descoberta de benefícios desde o primeiro clique.
            </p>
          </div>
          <Link href="/ofertas" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand)] hover:underline">
            Ver vitrine completa
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.title}
              href={`/ofertas?categoria=${encodeURIComponent(category.title)}`}
              className="group grid gap-3 rounded-[24px] border border-[#ddd5c8] bg-[#fbf8f2] p-4 transition hover:-translate-y-0.5 hover:border-[#c3b8a8] hover:bg-white"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef2e3] text-[var(--brand)]">
                <category.icon size={20} />
              </span>
              <div className="grid gap-1">
                <p className="m-0 text-lg font-bold text-[#18231c]">{category.title}</p>
                <p className="m-0 text-sm text-[var(--muted)]">{category.subtitle}</p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#385246] group-hover:text-[var(--brand)]">
                Abrir categoria
                <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="ofertas" className="grid gap-4">
        <div className="grid gap-3 rounded-[30px] border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-soft)] md:grid-cols-[1fr_auto] md:items-end md:p-7">
          <div className="grid gap-2">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Ofertas em destaque</p>
            <h2 className="font-display m-0 text-3xl leading-tight text-[#18231c] md:text-4xl">Benefícios selecionados para converter confiança em ação.</h2>
            <p className="m-0 max-w-2xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
              Cada card destaca o essencial da oferta e mantém o detalhe completo no modal, evitando excesso de informação na vitrine.
            </p>
          </div>
          <Link href="/ofertas" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand)] hover:underline">
            Ver todas as ofertas
            <ArrowRight size={16} />
          </Link>
        </div>

        {offersLoadingError ? (
          <article className="rounded-2xl border border-[#f0c8c8] bg-[#fff2f2] px-4 py-3 text-sm text-[#7c2323]">
            Não foi possível carregar as ofertas da home. Detalhe: {offersLoadingError}
          </article>
        ) : null}

        <div className="grid grid-flow-col auto-cols-[88%] gap-4 overflow-x-auto pb-1 md:grid-flow-row md:grid-cols-4 md:auto-cols-auto md:overflow-visible">
          {featuredOffers.map((offer) => (
            <OfferCard key={offer.id} actionHref="/auth" actionLabel="Quero essa oferta" offer={offer} />
          ))}
          {featuredOffers.length === 0 && <p className="card">As ofertas aprovadas aparecerão aqui assim que forem publicadas.</p>}
        </div>
      </section>

      <section className="grid gap-5 rounded-[34px] border border-[#203327] bg-[linear-gradient(145deg,#18271d_0%,#22362a_55%,#2b4737_100%)] p-5 text-white shadow-[var(--shadow-strong)] md:p-7">
        <div className="grid gap-3 md:grid-cols-[0.95fr_1.05fr] md:items-start">
          <div className="grid gap-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-white/80">
              <Users size={14} className="text-[var(--brand-accent)]" />
              Prova de confiança
            </span>
            <h2 className="font-display m-0 max-w-xl text-3xl leading-tight text-white md:text-4xl">
              Uma home mais limpa precisa sustentar credibilidade sem parecer genérica.
            </h2>
            <p className="m-0 max-w-xl text-sm leading-relaxed text-white/72 md:text-base">
              A nova leitura privilegia sinais concretos de confiança: curadoria, clareza operacional, foco territorial e
              depoimentos pontuais em vez de excesso de estímulos.
            </p>
            <div className="flex flex-wrap gap-2">
              {trustBadges.map((badge) => (
                <span key={badge} className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-bold text-white/82">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {trustTestimonials.slice(0, 3).map((item) => (
              <article key={`${item.name}-${item.neighborhood}`} className="grid gap-3 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="m-0 text-3xl font-black leading-none text-[var(--brand-accent)]">“</p>
                <p className="m-0 -mt-2 text-sm leading-relaxed text-white/78">{item.quote}</p>
                <div className="mt-1 flex items-center gap-2.5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-accent)] text-xs font-black text-[#152018]">
                    {getInitials(item.name)}
                  </span>
                  <div className="grid gap-0.5">
                    <p className="m-0 text-sm font-bold text-white">{item.name}</p>
                    <p className="m-0 text-xs text-white/62">{item.neighborhood}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 rounded-[34px] border border-[#ccb58a] bg-[linear-gradient(135deg,#f6ead4_0%,#f0dfc0_55%,#e7d2ac_100%)] p-5 shadow-[var(--shadow-soft)] md:p-7">
        <div className="grid gap-2 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div className="grid gap-2">
            <p className="m-0 text-xs font-black uppercase tracking-[0.08em] text-[#7d5620]">Bairros da Zona Norte</p>
            <h2 className="font-display m-0 text-3xl leading-tight text-[#2f1a03] md:text-4xl">
              {highlightNeighborhood} já está dentro da cobertura do ClubeZN.
            </h2>
            <p className="m-0 max-w-3xl text-sm text-[#5f370a] md:text-base">
              O mapa reforça o posicionamento territorial da marca e ajuda o usuário a entender rapidamente que a plataforma é
              relevante para a rotina local, não um marketplace genérico.
            </p>
          </div>
          <div className="grid gap-2 md:justify-items-end">
            <Link href="/ofertas" className="btn !w-full border border-[#91520f] bg-[#2f1a03] text-white md:!w-auto md:min-w-52">
              Ver ofertas por bairro
            </Link>
            <p className="m-0 text-xs font-semibold text-[#6e4312]">A seleção é exibida por bairro para reduzir atrito na escolha.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_0.9fr] md:items-stretch">
          <article className="relative overflow-hidden rounded-[26px] border border-[#d8a95d] bg-[#fff5e3] p-3 md:p-4">
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#e8ba76_0.8px,transparent_0.8px)] [background-size:14px_14px]" />
            <div className="relative z-[1]">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#7f4c0f]">Mapa Zona Norte com contornos reais</p>
              <div className="relative mt-2 overflow-hidden rounded-[22px] border border-[#dcb276] bg-white/60 p-2">
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

          <article className="grid gap-4 rounded-[26px] border border-[#d8a95d] bg-white/70 p-4 md:p-5">
            <div className="grid gap-2">
              <p className="m-0 text-sm font-extrabold text-[#552f05]">Como navegar por bairro</p>
              <p className="m-0 text-sm text-[#6e4312]">
                O bairro em destaque usa sua geolocalização quando disponível. A lista lateral permite ir direto para uma vitrine
                filtrada e contextualizada.
              </p>
            </div>
            <div className="grid gap-2 rounded-[22px] border border-[#e4c089] bg-[#fff7ea] p-4">
              <div className="flex items-center gap-2 text-[#6b4210]">
                <MapPinned size={18} />
                <p className="m-0 text-sm font-bold">Seu ponto de entrada pode começar pelo bairro.</p>
              </div>
              <p className="m-0 text-sm text-[#7f561f]">
                Isso ajuda a plataforma a parecer próxima, específica e útil, reforçando credibilidade pela relevância local.
              </p>
            </div>
            <div className="grid gap-1.5">
              {northZoneMapLayout.map((pin) => {
                const highlighted = normalizeText(pin.name) === normalizeText(highlightNeighborhood);
                return (
                  <Link
                    key={`${pin.name}-legend`}
                    href={`/ofertas?bairro=${encodeURIComponent(pin.name)}`}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
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
        className="grid gap-5 rounded-[30px] border border-[#cdd8cf] bg-[linear-gradient(135deg,#f7faf5_0%,#eef4ec_55%,#e7efe8_100%)] p-5 shadow-[var(--shadow-soft)] md:gap-6 md:p-7"
      >
        <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
          <div className="grid gap-2">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Fluxo de uso</p>
            <h2 className="font-display m-0 text-3xl text-[#102113] md:text-4xl">Entendimento imediato, sem tutorial cansativo.</h2>
            <p className="m-0 max-w-3xl text-sm text-[#486048] md:text-base">
              O processo foi mantido simples para sustentar conversão e confiança: poucas etapas, linguagem direta e expectativa clara.
            </p>
          </div>
          <Link href="/auth" className="btn btn-primary !w-full md:!w-auto md:min-w-48">
            Começar agora
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {howItWorksSteps.map((item) => (
            <article key={item.step} className="grid gap-2 rounded-[24px] border border-[#d6dfd8] bg-white p-4">
              <span className="inline-flex w-fit items-center justify-center rounded-full border border-[#c9d6cb] bg-[#edf4ef] px-2.5 py-1 text-xs font-black text-[var(--brand)]">
                Etapa {item.step}
              </span>
              <h4 className="m-0 text-base font-extrabold text-[#102113]">{item.title}</h4>
              <p className="m-0 text-sm text-[#486048]">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="parceiros" className="grid gap-4 md:grid-cols-[1.08fr_0.92fr]">
        <article className="grid gap-4 rounded-[30px] border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-soft)] md:p-7">
          <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
            <div className="grid gap-2">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Empresas parceiras</p>
              <h2 className="font-display m-0 text-3xl leading-tight text-[#18231c] md:text-4xl">Presença comercial com mais organização e menos ruído.</h2>
              <p className="m-0 max-w-2xl text-sm text-[var(--muted)] md:text-base">
                Em vez de repetir módulos de parceiros, a nova home concentra os perfis mais relevantes em uma vitrine única e
                consistente.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/parceiros" className="text-sm font-bold text-[var(--brand)] hover:underline">
                Ver todos
              </Link>
              <Link href="/auth" className="text-sm font-bold text-[var(--brand)] hover:underline">
                Quero ser parceiro
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {partnerProfiles.slice(0, 6).map((partner) => (
              <article key={partner.id} className="grid gap-3 rounded-[24px] border border-[#ddd5c8] bg-[#fbf8f2] p-4">
                {partner.coverImage ? (
                  <Image
                    alt={`Capa de ${partner.publicName ?? partner.name}`}
                    height={120}
                    src={partner.coverImage}
                    unoptimized
                    width={420}
                    style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 18 }}
                  />
                ) : null}
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#d5cec2] bg-white">
                    {partner.logoImage ? (
                      <Image
                        alt={`Logo de ${partner.publicName ?? partner.name}`}
                        height={40}
                        src={partner.logoImage}
                        unoptimized
                        width={40}
                        style={{ width: 40, height: 40, borderRadius: 999, objectFit: "cover" }}
                      />
                    ) : (
                      <Building2 size={18} className="text-[var(--brand)]" />
                    )}
                  </div>
                  <div className="grid gap-0.5">
                    <p className="m-0 text-base font-bold text-[#18231c]">{partner.publicName ?? partner.name}</p>
                    <p className="m-0 text-sm text-[var(--muted)]">{partner.category}</p>
                  </div>
                </div>
                <p className="m-0 text-sm text-[var(--muted)]">
                  {partner.addressLine || `${partner.neighborhood} - ${partner.city}/${partner.state}`}
                </p>
                <Link href={`/parceiros/${partner.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand)] hover:underline">
                  Ver perfil da empresa
                  <ArrowRight size={15} />
                </Link>
              </article>
            ))}
            {partnerProfiles.length === 0 && <p className="card">Sua empresa pode ser a primeira a aparecer nesta vitrine.</p>}
          </div>
        </article>

        <article className="grid gap-4 rounded-[30px] border border-[#cad792] bg-[linear-gradient(145deg,#eff7c6_0%,#ddeca1_100%)] p-5 shadow-[var(--shadow-soft)] md:p-7">
          <div className="grid gap-2">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#bac66f] bg-white/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#2a3418]">
              <ShieldCheck size={14} />
              Valor percebido
            </span>
            <h3 className="font-display m-0 text-3xl leading-tight text-[#1d2812]">Uma marca local precisa parecer confiável dos dois lados.</h3>
            <p className="m-0 text-sm leading-relaxed text-[#405229]">
              A home agora fala com o morador e com o parceiro sem parecer um template inflado: mais foco, melhores contrastes e
              CTAs objetivos.
            </p>
          </div>
          <div className="grid gap-3">
            {partnerHighlights.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-[22px] border border-[#c9d67b] bg-white/60 px-4 py-3">
                <BadgeCheck size={18} className="mt-0.5 shrink-0 text-[#31431e]" />
                <p className="m-0 text-sm font-semibold text-[#2a3418]">{item}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/auth" className="btn btn-primary !w-full text-center">
              Entrar no ClubeZN
            </Link>
            <Link href="/seja-parceiro" className="btn btn-ghost !w-full !border-[#a7b35a] !bg-white/75 text-center">
              Quero minha marca aqui
            </Link>
          </div>
        </article>
      </section>

      <section id="faq" className="grid gap-4 rounded-[30px] border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-soft)] md:p-7">
        <div className="grid gap-1">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Perguntas frequentes</p>
          <h2 className="font-display m-0 text-3xl text-[#102113] md:text-4xl">Dúvidas respondidas com objetividade.</h2>
          <p className="m-0 text-sm text-[#486048]">A seção foi mantida simples para reforçar clareza operacional e reduzir insegurança.</p>
        </div>
        <div className="grid gap-2">
          {faqItems.map((item) => (
            <details key={item.question} className="rounded-[22px] border border-[#ddd5c8] bg-[#fbf8f2] px-4 py-4">
              <summary className="cursor-pointer text-sm font-extrabold text-[#19321f]">{item.question}</summary>
              <p className="m-0 mt-2 text-sm leading-relaxed text-[#486048]">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="grid gap-6 rounded-[32px] border border-[#23382b] bg-[#18271d] p-5 text-[#d7e8db] shadow-[var(--shadow-strong)] md:p-8">
        <div className="grid gap-5 border-b border-[#294735] pb-5 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="grid gap-2">
            <BrandLogo />
            <p className="m-0 max-w-xl text-sm leading-relaxed text-[#b7cdbd]">
              ClubeZN conecta moradores e negócios da Zona Norte em uma plataforma de vantagens mais organizada, mais clara e com
              foco real na economia local.
            </p>
          </div>
          <div className="grid gap-2 rounded-[24px] border border-[#2f5440] bg-[#20372a] p-4 md:justify-self-end">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#9fc6ab]">Central de atendimento</p>
            <p className="m-0 text-sm font-semibold">contato@clubezn.com</p>
            <p className="m-0 text-sm font-semibold">WhatsApp: (51) 99999-0000</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="grid content-start gap-2">
            <p className="m-0 text-sm font-extrabold text-white">Empresa</p>
            <Link href="/como-funciona" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Como funciona</Link>
            <Link href="/parceiros" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Parceiros</Link>
            <Link href="/faq" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Perguntas frequentes</Link>
          </div>

          <div className="grid content-start gap-2">
            <p className="m-0 text-sm font-extrabold text-white">Plataforma</p>
            <Link href="/ofertas" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Ofertas</Link>
            <Link href="/auth" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Criar conta</Link>
            <Link href="/auth" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Entrar</Link>
          </div>

          <div className="grid content-start gap-2">
            <p className="m-0 text-sm font-extrabold text-white">Links úteis</p>
            <Link href="/seja-parceiro" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Seja parceiro</Link>
            <Link href="/suporte" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Fale com suporte</Link>
            <Link href="/status" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Status da plataforma</Link>
          </div>

          <div className="grid content-start gap-2">
            <p className="m-0 text-sm font-extrabold text-white">Legal</p>
            <Link href="/termos-de-uso" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Termos de uso</Link>
            <Link href="/privacidade" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Privacidade</Link>
            <Link href="/lgpd" className="text-sm text-[#b7cdbd] no-underline hover:text-white">LGPD</Link>
          </div>

          <div className="grid content-start gap-2">
            <p className="m-0 text-sm font-extrabold text-white">Redes sociais</p>
            <Link href="/instagram" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Instagram</Link>
            <Link href="/facebook" className="text-sm text-[#b7cdbd] no-underline hover:text-white">Facebook</Link>
            <Link href="/linkedin" className="text-sm text-[#b7cdbd] no-underline hover:text-white">LinkedIn</Link>
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
