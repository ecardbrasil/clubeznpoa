"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CircleHelp,
  Handshake,
  MapPin,
  Megaphone,
  ShieldCheck,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { OfferCard, type OfferCardData } from "@/components/offer-card";
import { SiteHeader } from "@/components/site-header";
import { isSupabaseMode } from "@/lib/runtime-config";
import { getData, initStorage } from "@/lib/storage";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase/client";
import type { Company } from "@/lib/types";
import { getHotOfferIds, getHotOfferIdsFromSupabase } from "@/lib/utils";

const heroHighlights = [
  { title: "Para moradores", text: "Descontos reais perto de casa, em poucos cliques.", icon: Wallet },
  { title: "Para empresas", text: "Mais visibilidade local e novos clientes da região.", icon: Store },
  { title: "Foco regional", text: "Plataforma pensada para a Zona Norte de Porto Alegre.", icon: MapPin },
];

const userBenefits = [
  {
    title: "Ofertas perto de você",
    text: "Encontre vantagens e promoções de empresas da sua região, com mais praticidade no dia a dia.",
  },
  {
    title: "Resgate simples e rápido",
    text: "Escolha a oferta, gere seu código e apresente no local parceiro para aproveitar o benefício.",
  },
  {
    title: "Tudo em um só lugar",
    text: "Acompanhe ofertas disponíveis, histórico de resgates e descubra novos parceiros da Zona Norte.",
  },
  {
    title: "Experiência prática no celular",
    text: "Navegue, encontre e resgate ofertas de forma rápida, com uma experiência pensada para mobile.",
  },
];

const howItWorksSteps = [
  {
    text: "Acesse a plataforma e encontre ofertas ativas.",
  },
  {
    text: "Escolha o benefício que deseja usar.",
  },
  {
    text: "Gere seu código de resgate em poucos segundos.",
  },
  {
    text: "Apresente o código à empresa parceira e aproveite.",
  },
];

const partnerBenefits = [
  "Publique ofertas com rapidez",
  "Divulgue sua empresa para o público da região",
  "Acompanhe seus resgates",
  "Fortaleça sua presença local",
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

const trustPoints = [
  "Plataforma com foco exclusivo na realidade da Zona Norte.",
  "Parcerias com comércio local para gerar economia prática.",
  "Experiência direta: menos cadastro, mais conversão de uso.",
];

const faqItems = [
  {
    question: "O ClubeZN é gratuito para quem quer usar as ofertas?",
    answer: "Basta acessar a plataforma, criar sua conta e começar a explorar os benefícios disponíveis.",
  },
  {
    question: "Como faço para resgatar uma oferta?",
    answer: "Você escolhe a oferta, gera um código de resgate e apresenta esse código para a empresa parceira dentro do prazo de validade.",
  },
  {
    question: "Minha empresa pode participar mesmo sem endereço físico?",
    answer: "Sim. A plataforma permite o cadastro de empresas que atuam sem endereço físico informado.",
  },
  {
    question: "As ofertas são só da Zona Norte?",
    answer: "O foco do ClubeZN é valorizar empresas e consumidores da Zona Norte de Porto Alegre.",
  },
  {
    question: "Como minha empresa entra na plataforma?",
    answer: "Basta realizar o cadastro como parceiro, preencher as informações do perfil e publicar suas ofertas.",
  },
];

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
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

  const featuredOffers: OfferCardData[] = approvedOffers
    .filter((offer) => companiesById.has(offer.companyId))
    .slice(0, 6)
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
    .slice(0, 6);

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
      .select("id, company_id, title, description, discount_label, category, neighborhood, images, approved, rejected"),
    supabase
      .from("companies")
      .select(
        "id, name, public_name, category, neighborhood, city, state, approved, logo_image, cover_image, address_line, bio, instagram, facebook, website, whatsapp",
      ),
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
  const hotOfferIds = getHotOfferIdsFromSupabase(redemptions, 3);

  const featuredOffers: OfferCardData[] = offers
    .filter((offer) => offer.approved && !offer.rejected && companiesById.has(offer.company_id))
    .slice(0, 6)
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
  const [featuredOffers, setFeaturedOffers] = useState<OfferCardData[]>([]);
  const [partnerProfiles, setPartnerProfiles] = useState<Company[]>([]);
  const [offersLoadingError, setOffersLoadingError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadLandingData = async () => {
      try {
        setLoading(true);
        setOffersLoadingError("");
        const mapped = isSupabaseMode ? await mapSupabaseLandingData() : mapLocalLandingData();
        if (cancelled) return;
        setFeaturedOffers(mapped.featuredOffers);
        setPartnerProfiles(mapped.partnerProfiles);
      } catch (error) {
        if (cancelled) return;
        setFeaturedOffers([]);
        setPartnerProfiles([]);
        setOffersLoadingError(getErrorMessage(error, "Falha ao carregar dados da vitrine."));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadLandingData();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main id="conteudo-principal" className="grid min-h-screen w-full gap-0 px-0 py-0">
      <section className="grid gap-4 bg-[#C9F549] p-3 md:gap-6 md:p-6">
        <SiteHeader
          sticky
          smallLogo
          links={[
            { label: "Início", href: "/" },
            { label: "Como funciona", href: "/#como-funciona" },
            { label: "Ofertas", href: "/ofertas" },
            { label: "Para empresas", href: "/#empresas" },
            { label: "Entrar", href: "/auth" },
          ]}
          className="md:px-6"
        />

        <section className="grid gap-5 px-1 pb-1 pt-1 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div className="grid gap-3">
            <span className="inline-flex w-fit rounded-full border border-[#bddf43] bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[#12200f]">
              Plataforma de vantagens locais
            </span>
            <h1 className="m-0 text-3xl font-black leading-tight text-[#102113] md:text-6xl">
              As melhores vantagens da Zona Norte, em um só lugar.
            </h1>
            <p className="m-0 max-w-2xl text-sm leading-relaxed text-[#1f3318] md:text-base">
              Descubra ofertas, benefícios e descontos de empresas parceiras da região. O ClubeZN conecta moradores da Zona Norte de
              Porto Alegre a oportunidades locais de forma simples, rápida e prática.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 sm:items-center">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#13210f] px-4 py-2.5 text-sm font-black text-white no-underline"
              >
                Quero ver ofertas
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#314a2f] bg-white px-4 py-2.5 text-sm font-bold text-[#1b2a20] no-underline"
              >
                Quero cadastrar minha empresa
              </Link>
            </div>
            <p className="m-0 text-xs font-semibold text-[#22331c] md:text-sm">Ofertas locais, resgate fácil e benefícios perto de você.</p>
          </div>

          <div className="grid gap-3 rounded-[28px] border border-[#c6df67] bg-white/70 p-3 md:p-4">
            <article className="grid gap-2 rounded-2xl border border-[#dfe5d4] bg-white p-4">
              {heroHighlights.map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-xl border border-[#e7eddc] bg-[#f8fbf4] px-3 py-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#C9F549] text-[#102113]">
                    <item.icon size={16} />
                  </span>
                  <div className="grid gap-1">
                    <p className="m-0 text-sm font-extrabold text-[#102113]">{item.title}</p>
                    <p className="m-0 text-xs text-[#4a5f51]">{item.text}</p>
                  </div>
                </div>
              ))}
            </article>

            <article className="rounded-2xl border border-[#dfe5d4] bg-white p-3">
              <p className="m-0 text-xs font-black uppercase tracking-[0.08em] text-[#2a3f2f]">Bairros em destaque</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {northZoneNeighborhoods.slice(0, 5).map((neighborhood) => (
                  <Link
                    key={`hero-${neighborhood}`}
                    href={`/ofertas?bairro=${encodeURIComponent(neighborhood)}`}
                    className="rounded-full border border-[#d8e3c4] bg-[#f8fbf4] px-3 py-1 text-xs font-bold text-[#2a3f2f] no-underline"
                  >
                    {neighborhood}
                  </Link>
                ))}
              </div>
            </article>
          </div>
        </section>
      </section>

      <div className="mx-auto grid w-full max-w-[1180px] gap-5 px-4 py-6 md:gap-6 md:px-6 md:py-8">
      <section className="grid gap-4 border border-[#dfe5d4] bg-white p-5 md:p-7">
        <span className="inline-flex w-fit rounded-full bg-[#eef5e5] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[#2a3f2f]">
          Apresentação
        </span>
        <h2 className="m-0 text-2xl font-black text-[#102113] md:text-3xl">O que é o ClubeZN?</h2>
        <p className="m-0 text-sm leading-relaxed text-[#3f5646] md:text-base">
          O ClubeZN é uma plataforma criada para aproximar moradores da Zona Norte de Porto Alegre de empresas parceiras da região.
          Aqui, o consumidor encontra ofertas ativas, resgata benefícios com facilidade e descobre oportunidades locais em poucos
          passos. Para as empresas, é uma forma prática de divulgar ofertas, atrair novos clientes e fortalecer a presença no bairro.
        </p>
      </section>

      <section id="vantagens" className="grid gap-4 border border-[#dfe5d4] bg-white p-5 md:p-7">
        <span className="inline-flex w-fit rounded-full bg-[#eef5e5] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[#2a3f2f]">
          Benefícios para moradores
        </span>
        <h2 className="m-0 text-2xl font-black text-[#102113] md:text-3xl">Por que usar o ClubeZN?</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {userBenefits.map((item) => (
            <article key={item.title} className="grid gap-2 rounded-xl border border-[#e7eddc] bg-[#f8fbf4] px-3 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#C9F549] text-[#14220f]">
                  <BadgeCheck size={15} />
                </span>
                <h3 className="m-0 text-base font-extrabold text-[#102113]">{item.title}</h3>
              </div>
              <p className="m-0 text-sm text-[#44584c]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="grid gap-4 border border-[#dfe5d4] bg-white p-5 md:p-7">
        <span className="inline-flex w-fit rounded-full bg-[#eef5e5] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[#2a3f2f]">
          Como funciona
        </span>
        <h2 className="m-0 text-2xl font-black text-[#102113] md:text-3xl">Como funciona?</h2>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {howItWorksSteps.map((item, index) => (
            <article key={item.text} className="grid gap-1 rounded-xl border border-[#e7eddc] bg-[#f8fbf4] p-3">
              <p className="m-0 text-xs font-black uppercase tracking-[0.08em] text-[#324639]">Passo {index + 1}</p>
              <p className="m-0 text-sm font-semibold text-[#1f3328]">{item.text}</p>
            </article>
          ))}
        </div>
        <p className="m-0 text-sm font-semibold text-[#324639]">Simples para quem usa, prático para quem oferece.</p>
      </section>

      <section id="empresas" className="grid gap-4 border border-[#d4dfbf] bg-[#f6fbe9] p-5 md:p-7">
        <span className="inline-flex w-fit rounded-full bg-[#C9F549] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[#13210f]">
          Para empresas parceiras
        </span>
        <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-2">
            <h2 className="m-0 text-2xl font-black text-[#102113] md:text-3xl">Sua empresa mais visível para quem está perto.</h2>
            <p className="m-0 text-sm text-[#3f5646] md:text-base">
              O ClubeZN também foi feito para negócios locais que querem atrair mais clientes e divulgar ofertas com agilidade. A empresa
              parceira pode cadastrar seu perfil, publicar ofertas e validar resgates de forma simples, sem processos complicados.
            </p>
            <div className="grid gap-2">
              {partnerBenefits.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-xl border border-[#d8e3c4] bg-white px-3 py-2">
                  <Handshake size={15} className="shrink-0 text-[#2e4227]" />
                  <p className="m-0 text-sm font-semibold text-[#1e3228]">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <aside className="grid content-start gap-2 rounded-xl border border-[#d8e3c4] bg-white p-3">
            <p className="m-0 text-xs font-black uppercase tracking-[0.08em] text-[#2e4227]">Parceiros em destaque</p>
            {partnerProfiles.length > 0 ? (
              partnerProfiles.slice(0, 4).map((partner) => (
                <Link
                  key={partner.id}
                  href={`/parceiros/${partner.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#e7eddc] px-3 py-2 text-sm font-semibold text-[#1e3228] no-underline hover:bg-[#f8fbf4]"
                >
                  <span>{partner.publicName ?? partner.name}</span>
                  <span className="text-xs text-[#4a5f51]">{partner.neighborhood}</span>
                </Link>
              ))
            ) : (
              <p className="m-0 rounded-lg border border-[#e7eddc] bg-[#f8fbf4] px-3 py-3 text-sm text-[#44584c]">
                Sua empresa pode ser a próxima em destaque.
              </p>
            )}
            <Link
              href="/auth"
              className="mt-1 inline-flex items-center justify-center rounded-full bg-[#C9F549] px-4 py-2 text-sm font-black text-[#0f1a13] no-underline"
            >
              Cadastrar minha empresa
            </Link>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 border border-[#dfe5d4] bg-white p-5 md:p-7">
        <span className="inline-flex w-fit rounded-full bg-[#eef5e5] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[#2a3f2f]">
          Destaque regional
        </span>
        <h2 className="m-0 text-2xl font-black text-[#102113] md:text-3xl">Foco na Zona Norte de Porto Alegre</h2>
        <p className="m-0 text-sm text-[#3f5646] md:text-base">
          O ClubeZN nasce com foco na valorização do comércio local e na criação de uma rede de vantagens realmente útil para quem vive,
          circula e consome na Zona Norte. A proposta é fortalecer conexões entre moradores e empresas parceiras, começando pela região e
          crescendo com densidade por bairro e categoria.
        </p>
        <div className="flex flex-wrap gap-2">
          {northZoneNeighborhoods.map((neighborhood) => (
            <Link
              key={neighborhood}
              href={`/ofertas?bairro=${encodeURIComponent(neighborhood)}`}
              className="rounded-full border border-[#d8e3c4] bg-[#f8fbf4] px-3 py-1.5 text-xs font-bold text-[#2a3f2f] no-underline"
            >
              {neighborhood}
            </Link>
          ))}
        </div>
      </section>

      <section id="ofertas" className="grid gap-4 border border-[#dfe5d4] bg-white p-5 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="grid gap-1">
            <span className="inline-flex w-fit rounded-full bg-[#eef5e5] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[#2a3f2f]">
              Ofertas em destaque
            </span>
            <h2 className="m-0 text-2xl font-black text-[#102113] md:text-3xl">Ofertas em destaque</h2>
            <p className="m-0 text-sm text-[#44584c] md:text-base">
              Confira algumas das vantagens que já estão disponíveis na plataforma e descubra novas oportunidades perto de você.
            </p>
          </div>
          <Link href="/ofertas" className="text-sm font-bold text-[#1d3428] no-underline hover:underline">
            Ver todas as ofertas
          </Link>
        </div>

        {offersLoadingError ? (
          <p className="m-0 rounded-xl border border-[#f1d0d0] bg-[#fff6f6] px-3 py-3 text-sm text-[#8d2c2c]">{offersLoadingError}</p>
        ) : null}

        {loading ? (
          <p className="m-0 rounded-xl border border-[#e7eddc] bg-[#f8fbf4] px-3 py-3 text-sm text-[#44584c]">Carregando vitrine...</p>
        ) : null}

        {!loading && featuredOffers.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {featuredOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} actionLabel="Resgatar agora" actionHref="/auth" secondaryLabel="Ver detalhes" />
            ))}
          </div>
        ) : null}

        {!loading && !offersLoadingError && featuredOffers.length === 0 ? (
          <p className="m-0 rounded-xl border border-[#e7eddc] bg-[#f8fbf4] px-3 py-3 text-sm text-[#44584c]">
            Ainda não há ofertas em destaque. Novas vantagens serão publicadas em breve.
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 border border-[#d4dfbf] bg-[#f6fbe9] p-5 md:p-7">
        <span className="inline-flex w-fit rounded-full bg-[#C9F549] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[#13210f]">
          Confiança e proposta de valor
        </span>
        <h2 className="m-0 text-2xl font-black text-[#102113] md:text-3xl">Mais praticidade para quem busca. Mais visibilidade para quem vende.</h2>
        <p className="m-0 text-sm text-[#44584c] md:text-base">
          O ClubeZN reúne consumidores e empresas da mesma região em uma plataforma simples, direta e funcional. Para quem mora na Zona
          Norte, fica mais fácil encontrar vantagens locais. Para os parceiros, fica mais fácil transformar oferta em movimento real.
        </p>
        <div className="grid gap-2 md:grid-cols-3">
          <article className="rounded-xl border border-[#d8e3c4] bg-white p-3">
            <ShieldCheck size={18} className="text-[#263920]" />
            <h3 className="m-0 mt-2 text-base font-extrabold text-[#102113]">Confiança para usar</h3>
            <p className="m-0 mt-1 text-sm text-[#44584c]">Fluxo claro para o morador: oferta, código e resgate sem complicação.</p>
          </article>
          <article className="rounded-xl border border-[#d8e3c4] bg-white p-3">
            <Megaphone size={18} className="text-[#263920]" />
            <h3 className="m-0 mt-2 text-base font-extrabold text-[#102113]">Visibilidade local</h3>
            <p className="m-0 mt-1 text-sm text-[#44584c]">A empresa aparece para quem realmente compra na região.</p>
          </article>
          <article className="rounded-xl border border-[#d8e3c4] bg-white p-3">
            <Users size={18} className="text-[#263920]" />
            <h3 className="m-0 mt-2 text-base font-extrabold text-[#102113]">Conexão de comunidade</h3>
            <p className="m-0 mt-1 text-sm text-[#44584c]">Morador e comércio local ganham juntos com uma relação mais próxima.</p>
          </article>
        </div>
        <ul className="m-0 grid gap-2 pl-0">
          {trustPoints.map((point) => (
            <li key={point} className="list-none rounded-lg border border-[#d8e3c4] bg-white px-3 py-2 text-sm font-semibold text-[#1e3228]">
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section id="faq" className="grid gap-4 border border-[#dfe5d4] bg-white p-5 md:p-7">
        <span className="inline-flex w-fit rounded-full bg-[#eef5e5] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[#2a3f2f]">
          FAQ
        </span>
        <h2 className="m-0 text-2xl font-black text-[#102113] md:text-3xl">Dúvidas frequentes</h2>
        <div className="grid gap-2">
          {faqItems.map((item) => (
            <details key={item.question} className="rounded-xl border border-[#e7eddc] bg-[#f8fbf4] px-3 py-3">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-extrabold text-[#102113]">
                <CircleHelp size={14} />
                {item.question}
              </summary>
              <p className="m-0 mt-2 text-sm text-[#44584c]">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="grid gap-4 border border-[#d4dfbf] bg-[#C9F549] p-5 md:p-7">
        <span className="inline-flex w-fit rounded-full border border-[#aecf3f] bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[#13210f]">
          Comece agora
        </span>
        <h2 className="m-0 text-2xl font-black text-[#102113] md:text-3xl">Comece a aproveitar as vantagens do ClubeZN.</h2>
        <p className="m-0 text-sm text-[#1f3318] md:text-base">
          Entre agora para descobrir ofertas locais ou cadastre sua empresa e faça parte da rede de parceiros da Zona Norte.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/auth" className="rounded-full border border-[#13210f] bg-[#13210f] px-4 py-2 text-sm font-black text-white no-underline">
            Entrar na plataforma
          </Link>
          <Link href="/auth" className="rounded-full border border-[#13210f] bg-white px-4 py-2 text-sm font-black text-[#13210f] no-underline">
            Cadastrar empresa
          </Link>
        </div>
      </section>

      <footer className="grid gap-4 border border-[#dfe5d4] bg-white p-5 md:p-7">
        <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="grid gap-2">
            <BrandLogo small />
            <p className="m-0 text-sm text-[#44584c]">
              ClubeZN conecta moradores e empresas da Zona Norte com ofertas locais, de forma simples, rápida e confiável.
            </p>
          </div>
          <div className="grid gap-1 rounded-xl border border-[#e7eddc] bg-[#f8fbf4] p-3">
            <p className="m-0 text-xs font-black uppercase tracking-[0.08em] text-[#2a3f2f]">Contato</p>
            <p className="m-0 text-sm font-semibold text-[#1e3228]">contato@clubezn.com</p>
            <p className="m-0 text-xs text-[#44584c]">Zona Norte, Porto Alegre/RS</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e7eddc] pt-3 text-xs text-[#4a5f51]">
          <p className="m-0">© {new Date().getFullYear()} ClubeZN</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/ofertas" className="text-[#2a3f2f] no-underline hover:underline">
              Ofertas
            </Link>
            <Link href="/parceiros" className="text-[#2a3f2f] no-underline hover:underline">
              Parceiros
            </Link>
            <Link href="/auth" className="text-[#2a3f2f] no-underline hover:underline">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
      </div>
    </main>
  );
}
