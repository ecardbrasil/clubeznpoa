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
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/brand-logo";
import { OfferCard, type OfferCardData } from "@/components/offer-card";
import { SiteHeader } from "@/components/site-header";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase/client";
import type { Company } from "@/lib/types";
import { getHotOfferIdsFromSupabase } from "@/lib/utils";

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

const northZoneNeighborhoods = ["Sarandi", "Passo d'Areia", "Jardim Lindóia", "São João", "Cristo Redentor", "Vila Ipiranga", "Rubem Berta", "Jardim Leopoldina"];

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

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : typeof error === "string" ? error : fallback;

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

const countOffersByCompanyId = (offers: Array<{ companyId?: string; company_id?: string; approved?: boolean; rejected?: boolean }>) =>
  offers
    .filter((o) => o.approved && !o.rejected)
    .reduce<Record<string, number>>((acc, o) => {
      const id = o.companyId || o.company_id;
      if (id) acc[id] = (acc[id] ?? 0) + 1;
      return acc;
    }, {});


const mapSupabaseLandingData = async () => {
  if (!hasSupabaseEnv()) throw new Error("Variáveis do Supabase não configuradas.");

  const supabase = getSupabaseBrowserClient();
  const [offersRes, companiesRes, redemptionsRes] = await Promise.all([
    supabase.from("offers").select("id, company_id, title, description, discount_label, category, neighborhood, images, approved, rejected"),
    supabase.from("companies").select("id, name, public_name, category, neighborhood, city, state, approved, logo_image, cover_image, address_line, bio, instagram, facebook, website, whatsapp"),
    supabase.from("redemptions").select("offer_id, status"),
  ]);

  if (offersRes.error) throw new Error(getErrorMessage(offersRes.error, "Falha ao consultar ofertas no Supabase."));
  if (companiesRes.error) throw new Error(getErrorMessage(companiesRes.error, "Falha ao consultar empresas no Supabase."));

  const offers = (offersRes.data ?? []) as SupabaseOfferRow[];
  const companies = (companiesRes.data ?? []) as SupabaseCompanyRow[];
  const redemptions = redemptionsRes.error ? [] : (redemptionsRes.data ?? []);

  const companiesById = new Map(companies.map((c) => [c.id, c]));
  const hotOfferIds = getHotOfferIdsFromSupabase(redemptions, 3);
  const offerCountByCompanyId = countOffersByCompanyId(offers);

  const featuredOffers: OfferCardData[] = offers
    .filter((o) => o.approved && !o.rejected && companiesById.has(o.company_id))
    .slice(0, 6)
    .map((o) => {
      const c = companiesById.get(o.company_id)!;
      return {
        id: o.id,
        companyId: o.company_id,
        title: o.title,
        description: o.description,
        discountLabel: o.discount_label,
        category: o.category,
        neighborhood: o.neighborhood,
        isFeatured: false,
        companyName: c.public_name ?? c.name ?? "Parceiro ClubeZN",
        images: Array.isArray(o.images) ? o.images : [],
        partnerLogoImage: c.logo_image ?? undefined,
        partnerCoverImage: c.cover_image ?? undefined,
        partnerAddressLine: c.address_line ?? undefined,
        partnerInstagram: c.instagram ?? undefined,
        partnerFacebook: c.facebook ?? undefined,
        partnerWebsite: c.website ?? undefined,
        partnerWhatsapp: c.whatsapp ?? undefined,
      };
    });

  const partnerProfiles: Company[] = Array.from(companiesById.values())
    .filter((c) => c.approved)
    .sort((a, b) => {
      const diff = (offerCountByCompanyId[b.id] ?? 0) - (offerCountByCompanyId[a.id] ?? 0);
      return diff !== 0 ? diff : (a.public_name ?? a.name).localeCompare(b.public_name ?? b.name, "pt-BR");
    })
    .slice(0, 6)
    .map((c) => ({
      id: c.id,
      name: c.name,
      publicName: c.public_name ?? undefined,
      category: c.category,
      neighborhood: c.neighborhood,
      city: c.city,
      state: c.state,
      ownerUserId: "",
      approved: c.approved,
      logoImage: c.logo_image ?? undefined,
      coverImage: c.cover_image ?? undefined,
      addressLine: c.address_line ?? undefined,
      bio: c.bio ?? undefined,
      instagram: c.instagram ?? undefined,
      facebook: c.facebook ?? undefined,
      website: c.website ?? undefined,
      whatsapp: c.whatsapp ?? undefined,
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
        const mapped = await mapSupabaseLandingData();
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
    <main id="conteudo-principal" className="grid w-full gap-0 overflow-hidden px-0 py-0">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');

        :root {
          --font-poppins: 'Poppins', sans-serif;
          --font-dm: 'DM Sans', sans-serif;
        }

        .hero-grid {
          background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
          position: relative;
          overflow: hidden;
        }

        .hero-grid::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(201, 245, 73, 0.08) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .hero-grid::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -5%;
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, rgba(201, 245, 73, 0.05) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .feature-card {
          position: relative;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(16, 33, 19, 0.1);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: #C9F549;
          box-shadow: 0 12px 24px rgba(201, 245, 73, 0.15);
        }

        .floating-element {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
      `}
      </style>

      <section className="hero-grid relative min-h-screen w-full">
        <SiteHeader sticky smallLogo className="md:px-6 relative z-20" />

        <div className="relative z-10 grid w-full max-w-7xl gap-12 px-4 py-16 mx-auto md:gap-16 md:px-6 md:py-24">
          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <motion.div
              className="grid gap-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.span
                className="inline-flex w-fit rounded-full bg-gradient-to-r from-[#C9F549] to-[#a8d63a] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#0f1a13] backdrop-blur"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                ✦ Zona Norte, Porto Alegre
              </motion.span>

              <motion.h1
                className="text-4xl font-black leading-[1.2] text-[#0a0f0c] md:text-7xl"
                style={{ fontFamily: 'var(--font-poppins)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                Descontos que <br />
                <span className="bg-gradient-to-r from-[#C9F549] to-[#a8d63a] bg-clip-text text-transparent">
                  impactam
                </span>{" "}
                realmente
              </motion.h1>

              <motion.p
                className="max-w-2xl text-lg leading-relaxed text-[#3a4a42] md:text-xl"
                style={{ fontFamily: 'var(--font-dm)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
              >
                Conectamos você com as melhores ofertas da Zona Norte. Para quem busca economia real, e para empresas que querem crescer local.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-3 pt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
              >
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0a0f0c] px-6 py-3.5 text-sm font-black text-white no-underline transition-all hover:shadow-lg hover:scale-[1.02] active:scale-95"
                >
                  Ver ofertas agora
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[#0a0f0c] bg-white px-6 py-3.5 text-sm font-bold text-[#0a0f0c] no-underline transition-all hover:bg-[#f8fbf4] active:scale-95"
                >
                  Sou empresa
                </Link>
              </motion.div>
            </motion.div>

            <div className="relative">
              <motion.div
                className="floating-element"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <div className="feature-card rounded-2xl p-6 space-y-4">
                  {heroHighlights.map((item, idx) => (
                    <motion.div
                      key={item.title}
                      className="group flex items-start gap-3 rounded-xl p-4 hover:bg-[#f8fbf4] transition-colors"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1, duration: 0.6 }}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C9F549] to-[#a8d63a] text-[#0a0f0c] group-hover:scale-110 transition-transform">
                        <item.icon size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-[#0a0f0c]" style={{ fontFamily: 'var(--font-poppins)' }}>{item.title}</p>
                        <p className="text-sm text-[#556b61]" style={{ fontFamily: 'var(--font-dm)' }}>{item.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div
            className="grid gap-3 md:grid-cols-5 pt-6 border-t border-[#e7eddc]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
          >
            <div className="text-center">
              <p className="text-2xl font-black text-[#0a0f0c]" style={{ fontFamily: 'var(--font-poppins)' }}>8+</p>
              <p className="text-xs text-[#556b61] uppercase tracking-wide">Bairros</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-[#0a0f0c]" style={{ fontFamily: 'var(--font-poppins)' }}>100+</p>
              <p className="text-xs text-[#556b61] uppercase tracking-wide">Parceiros</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-[#0a0f0c]" style={{ fontFamily: 'var(--font-poppins)' }}>1000+</p>
              <p className="text-xs text-[#556b61] uppercase tracking-wide">Ofertas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-[#0a0f0c]" style={{ fontFamily: 'var(--font-poppins)' }}>24h</p>
              <p className="text-xs text-[#556b61] uppercase tracking-wide">Resgate rápido</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-[#0a0f0c]" style={{ fontFamily: 'var(--font-poppins)' }}>0%</p>
              <p className="text-xs text-[#556b61] uppercase tracking-wide">Taxa para usar</p>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-[1180px] gap-8 px-4 py-12 md:gap-12 md:px-6 md:py-16">
      <motion.section
        className="grid gap-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="space-y-4">
          <span className="inline-flex w-fit rounded-full bg-[#C9F549] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#0a0f0c]">
            ✦ Quem somos
          </span>
          <h2 className="text-3xl font-black leading-tight text-[#0a0f0c] md:text-5xl" style={{ fontFamily: 'var(--font-poppins)' }}>
            Uma plataforma <br /> pensada para <span className="text-[#C9F549]">sua região</span>
          </h2>
          <p className="max-w-3xl text-lg leading-relaxed text-[#3a4a42] md:text-xl" style={{ fontFamily: 'var(--font-dm)' }}>
            O ClubeZN nasceu para conectar moradores da Zona Norte com as melhores ofertas locais. Simples, rápido e pensado para quem realmente vive e consome por aqui. Para empresas, é um canal direto com seus clientes de verdade.
          </p>
        </div>
      </motion.section>

      <motion.section
        id="vantagens"
        className="grid gap-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="space-y-4">
          <span className="inline-flex w-fit rounded-full bg-[#C9F549] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#0a0f0c]">
            ✦ Benefícios
          </span>
          <h2 className="text-3xl font-black leading-tight text-[#0a0f0c] md:text-5xl" style={{ fontFamily: 'var(--font-poppins)' }}>
            Tudo que você precisa em um só lugar
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {userBenefits.map((item, idx) => (
            <motion.article
              key={item.title}
              className="group rounded-2xl bg-white border border-[#e7eddc] p-6 hover:shadow-lg hover:border-[#C9F549] transition-all cursor-default"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#C9F549] to-[#a8d63a] text-[#0a0f0c] group-hover:scale-110 transition-transform">
                  <BadgeCheck size={20} />
                </div>
                <h3 className="font-bold text-[#0a0f0c] text-lg" style={{ fontFamily: 'var(--font-poppins)' }}>{item.title}</h3>
              </div>
              <p className="text-[#556b61] leading-relaxed" style={{ fontFamily: 'var(--font-dm)' }}>{item.text}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section
        id="como-funciona"
        className="grid gap-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="space-y-4">
          <span className="inline-flex w-fit rounded-full bg-[#C9F549] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#0a0f0c]">
            ✦ Como funciona
          </span>
          <h2 className="text-3xl font-black leading-tight text-[#0a0f0c] md:text-5xl" style={{ fontFamily: 'var(--font-poppins)' }}>
            4 passos para economizar
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 relative">
          {howItWorksSteps.map((item, i) => (
            <motion.article
              key={item.text}
              className="relative rounded-2xl bg-gradient-to-br from-white to-[#f8fbf4] border border-[#e7eddc] p-6 group"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#C9F549] to-transparent opacity-10 rounded-full -mr-12 -mt-12 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C9F549] text-[#0a0f0c] font-black mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                  {i + 1}
                </div>
                <p className="font-bold text-[#0a0f0c] text-base" style={{ fontFamily: 'var(--font-poppins)' }}>{item.text}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section
        id="empresas"
        className="grid gap-6 rounded-2xl bg-gradient-to-br from-[#f8fbf4] to-white border border-[#e7eddc] p-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="space-y-4">
              <span className="inline-flex w-fit rounded-full bg-[#C9F549] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#0a0f0c]">
                ✦ Para empresas
              </span>
              <h2 className="text-3xl font-black leading-tight text-[#0a0f0c] md:text-4xl" style={{ fontFamily: 'var(--font-poppins)' }}>
                Cresça vendendo para sua vizinhança
              </h2>
              <p className="text-lg text-[#3a4a42] leading-relaxed" style={{ fontFamily: 'var(--font-dm)' }}>
                Divulgue ofertas com agilidade, atraia clientes reais da região e valide resgates sem complicação. Você é o protagonista.
              </p>
            </div>
            <div className="grid gap-3">
              {partnerBenefits.map((item, idx) => (
                <motion.div
                  key={item}
                  className="flex items-center gap-3 rounded-xl bg-white border border-[#e7eddc] px-4 py-3 group hover:border-[#C9F549] transition-all"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  viewport={{ once: true }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C9F549] text-[#0a0f0c]">
                    <Handshake size={16} />
                  </div>
                  <p className="font-semibold text-[#0a0f0c]" style={{ fontFamily: 'var(--font-poppins)' }}>{item}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.aside
            className="rounded-2xl bg-white border border-[#e7eddc] p-6 space-y-4 sticky top-24 h-fit"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0a0f0c] mb-3">★ Parceiros em destaque</p>
              <div className="space-y-2">
                {partnerProfiles.length > 0 ? (
                  partnerProfiles.slice(0, 4).map((partner) => (
                    <Link
                      key={partner.id}
                      href={`/parceiros/${partner.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg p-3 text-sm font-semibold text-[#0a0f0c] no-underline hover:bg-[#f8fbf4] transition-colors"
                    >
                      <span>{partner.publicName ?? partner.name}</span>
                      <span className="text-xs text-[#556b61] bg-[#f8fbf4] px-2 py-1 rounded">{partner.neighborhood}</span>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-[#556b61] py-3">Sua empresa pode ser a próxima em destaque.</p>
                )}
              </div>
            </div>
            <Link
              href="/auth"
              className="block w-full rounded-lg bg-[#C9F549] px-4 py-3 text-center font-black text-[#0a0f0c] no-underline transition-all hover:shadow-lg active:scale-95"
            >
              Cadastrar agora
            </Link>
          </motion.aside>
        </div>
      </motion.section>

      <motion.section
        className="grid gap-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="space-y-4">
          <span className="inline-flex w-fit rounded-full bg-[#C9F549] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#0a0f0c]">
            ✦ Regional
          </span>
          <h2 className="text-3xl font-black leading-tight text-[#0a0f0c] md:text-5xl" style={{ fontFamily: 'var(--font-poppins)' }}>
            Cobrindo toda a <br /> Zona Norte
          </h2>
          <p className="max-w-2xl text-lg text-[#3a4a42] leading-relaxed" style={{ fontFamily: 'var(--font-dm)' }}>
            Do Sarandi até a Vila Ipiranga. Cada bairro com suas ofertas, oportunidades e parceiros locais.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {northZoneNeighborhoods.map((n, idx) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Link
                href={`/ofertas?bairro=${encodeURIComponent(n)}`}
                className="block text-center rounded-lg border border-[#e7eddc] bg-white px-4 py-3 font-bold text-[#0a0f0c] no-underline hover:border-[#C9F549] hover:bg-[#f8fbf4] transition-all group"
              >
                <MapPin size={18} className="mx-auto mb-1 text-[#C9F549]" />
                <span className="text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>{n}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        id="ofertas"
        className="grid gap-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-4">
            <span className="inline-flex w-fit rounded-full bg-[#C9F549] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#0a0f0c]">
              ✦ Vitrine
            </span>
            <div>
              <h2 className="text-3xl font-black leading-tight text-[#0a0f0c] md:text-5xl" style={{ fontFamily: 'var(--font-poppins)' }}>
                Ofertas que valem a pena
              </h2>
            </div>
          </div>
          <Link
            href="/ofertas"
            className="flex items-center gap-2 rounded-lg px-4 py-3 font-bold text-[#0a0f0c] no-underline hover:bg-[#f8fbf4] transition-colors group"
          >
            Explorar todas
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {offersLoadingError ? (
          <motion.p
            className="rounded-lg border border-[#f1d0d0] bg-[#fff6f6] px-4 py-3 text-sm text-[#8d2c2c]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {offersLoadingError}
          </motion.p>
        ) : null}

        {loading ? (
          <motion.div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-[#f8fbf4] animate-pulse"></div>
            ))}
          </motion.div>
        ) : null}

        {!loading && featuredOffers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredOffers.map((offer, idx) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <OfferCard offer={offer} actionLabel="Resgatar agora" actionHref="/auth" secondaryLabel="Ver detalhes" />
              </motion.div>
            ))}
          </div>
        ) : null}

        {!loading && !offersLoadingError && featuredOffers.length === 0 ? (
          <motion.p className="rounded-lg border border-[#e7eddc] bg-[#f8fbf4] px-4 py-4 text-center text-[#556b61]">
            Novas ofertas em breve! Voltamos em poucos dias.
          </motion.p>
        ) : null}
      </motion.section>

      <motion.section
        className="grid gap-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="space-y-4">
          <span className="inline-flex w-fit rounded-full bg-[#C9F549] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#0a0f0c]">
            ✦ Confiança
          </span>
          <h2 className="text-3xl font-black leading-tight text-[#0a0f0c] md:text-5xl" style={{ fontFamily: 'var(--font-poppins)' }}>
            Simples para quem usa, <br /> real para quem vende
          </h2>
          <p className="max-w-3xl text-lg text-[#3a4a42] leading-relaxed" style={{ fontFamily: 'var(--font-dm)' }}>
            ClubeZN é uma conexão direta entre você e a sua vizinhança. Sem algoritmo misterioso, sem desperdício de oferta, só relacionamento de verdade.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Confiança", desc: "Fluxo claro: oferta, código, resgate. Sem surpresa." },
            { icon: Megaphone, title: "Visibilidade", desc: "Apareça para quem realmente compra perto de você." },
            { icon: Users, title: "Comunidade", desc: "Morador e comércio ganham juntos. Relação próxima." }
          ].map((item, idx) => (
            <motion.article
              key={item.title}
              className="rounded-xl bg-white border border-[#e7eddc] p-6 group hover:shadow-lg hover:border-[#C9F549] transition-all"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#C9F549] to-[#a8d63a] text-[#0a0f0c] mb-4 group-hover:scale-110 transition-transform">
                <item.icon size={24} />
              </div>
              <h3 className="font-bold text-[#0a0f0c] mb-2 text-lg" style={{ fontFamily: 'var(--font-poppins)' }}>{item.title}</h3>
              <p className="text-[#556b61] text-sm leading-relaxed" style={{ fontFamily: 'var(--font-dm)' }}>{item.desc}</p>
            </motion.article>
          ))}
        </div>

        <div className="grid gap-3">
          {trustPoints.map((point, idx) => (
            <motion.div
              key={point}
              className="rounded-lg bg-white border border-[#e7eddc] px-6 py-4 flex items-start gap-3 group hover:border-[#C9F549] transition-all"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9F549] text-[#0a0f0c] mt-0.5 font-bold group-hover:scale-110 transition-transform" style={{ fontFamily: 'var(--font-poppins)' }}>
                ✓
              </div>
              <p className="font-semibold text-[#0a0f0c]" style={{ fontFamily: 'var(--font-poppins)' }}>{point}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        id="faq"
        className="grid gap-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="space-y-4">
          <span className="inline-flex w-fit rounded-full bg-[#C9F549] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#0a0f0c]">
            ✦ FAQ
          </span>
          <h2 className="text-3xl font-black leading-tight text-[#0a0f0c] md:text-5xl" style={{ fontFamily: 'var(--font-poppins)' }}>
            Dúvidas? Tem resposta aqui
          </h2>
        </div>
        <div className="grid gap-3 max-w-3xl">
          {faqItems.map((item, idx) => (
            <motion.details
              key={item.question}
              className="group rounded-lg border border-[#e7eddc] bg-white p-4 cursor-pointer hover:border-[#C9F549] transition-all open:border-[#C9F549] open:bg-[#f8fbf4]"
              initial={{ opacity: 0, y: 5 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-2 font-bold text-[#0a0f0c] select-none" style={{ fontFamily: 'var(--font-poppins)' }}>
                <div className="flex items-center gap-3">
                  <CircleHelp size={18} className="text-[#C9F549] shrink-0" />
                  <span>{item.question}</span>
                </div>
                <div className="text-[#C9F549] group-open:rotate-180 transition-transform">+</div>
              </summary>
              <p className="mt-3 ml-9 text-[#556b61] leading-relaxed text-sm" style={{ fontFamily: 'var(--font-dm)' }}>{item.answer}</p>
            </motion.details>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="rounded-2xl bg-gradient-to-br from-[#C9F549] to-[#a8d63a] p-8 md:p-12 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(16, 33, 19, 0.1) 0%, transparent 50%)',
          }}></div>
        </div>

        <div className="relative z-10 grid gap-6 max-w-2xl">
          <div className="space-y-4">
            <span className="inline-flex w-fit rounded-full border-2 border-[#0a0f0c] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#0a0f0c]">
              ✦ Comece agora
            </span>
            <h2 className="text-3xl font-black leading-tight text-[#0a0f0c] md:text-5xl" style={{ fontFamily: 'var(--font-poppins)' }}>
              Pronto para descobrir ofertas reais e perto de você?
            </h2>
            <p className="text-lg text-[#1f3318]" style={{ fontFamily: 'var(--font-dm)' }}>
              Acesse agora e comece a economizar, ou publique sua primeira oferta como parceiro.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/auth"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0a0f0c] px-6 py-3 font-black text-white no-underline transition-all hover:shadow-lg hover:scale-[1.02] active:scale-95"
            >
              Entrar agora
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center rounded-lg border-2 border-[#0a0f0c] bg-white px-6 py-3 font-black text-[#0a0f0c] no-underline transition-all hover:bg-[#fafaf8] active:scale-95"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </motion.section>

      <footer className="grid gap-8 border-t border-[#e7eddc] bg-white p-8 md:p-12">
        <motion.div
          className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-start"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="space-y-3">
            <BrandLogo small />
            <p className="text-[#3a4a42] leading-relaxed max-w-xl" style={{ fontFamily: 'var(--font-dm)' }}>
              ClubeZN conecta moradores e empresas da Zona Norte com ofertas locais, de forma simples, rápida e confiável.
            </p>
          </div>
          <div className="rounded-lg border border-[#e7eddc] bg-[#f8fbf4] p-4 space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0a0f0c]">★ Contato</p>
            <a href="mailto:contato@clubezn.com" className="block font-semibold text-[#0a0f0c] no-underline hover:text-[#C9F549] transition-colors">
              contato@clubezn.com
            </a>
            <p className="text-xs text-[#556b61]">Zona Norte, Porto Alegre/RS</p>
          </div>
        </motion.div>

        <div className="flex flex-col gap-4 border-t border-[#e7eddc] pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-[#556b61]">© {new Date().getFullYear()} ClubeZN. Construído com foco na Zona Norte.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/ofertas" className="text-sm font-semibold text-[#0a0f0c] no-underline hover:text-[#C9F549] transition-colors">
              Ofertas
            </Link>
            <Link href="/parceiros" className="text-sm font-semibold text-[#0a0f0c] no-underline hover:text-[#C9F549] transition-colors">
              Parceiros
            </Link>
            <Link href="/como-funciona" className="text-sm font-semibold text-[#0a0f0c] no-underline hover:text-[#C9F549] transition-colors">
              Como funciona
            </Link>
            <Link href="/auth" className="text-sm font-semibold text-[#0a0f0c] no-underline hover:text-[#C9F549] transition-colors">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
      </div>
    </main>
  );
}
