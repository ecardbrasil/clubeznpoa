"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { OfferCard, type OfferCardData } from "@/components/offer-card";
import { PublicPageHeader } from "@/components/public-page-header";
import { isSupabaseMode } from "@/lib/runtime-config";
import { getData, initStorage } from "@/lib/storage";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { Company } from "@/lib/types";
import { getHotOfferIds } from "@/lib/utils";

const ensureHttp = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const normalizePhone = (value: string) => value.replace(/\D/g, "");

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
  created_at: string;
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
  rejected: boolean;
  created_at: string;
};

const mapSupabaseCompany = (row: SupabaseCompanyRow): Company => ({
  id: row.id,
  name: row.name,
  publicName: row.public_name ?? undefined,
  category: row.category,
  neighborhood: row.neighborhood,
  city: row.city,
  state: row.state,
  ownerUserId: "",
  approved: row.approved,
  logoImage: row.logo_image ?? undefined,
  coverImage: row.cover_image ?? undefined,
  addressLine: row.address_line ?? undefined,
  bio: row.bio ?? undefined,
  instagram: row.instagram ?? undefined,
  facebook: row.facebook ?? undefined,
  website: row.website ?? undefined,
  whatsapp: row.whatsapp ?? undefined,
  createdAt: row.created_at,
});

export default function PartnerPublicProfilePage() {
  const params = useParams<{ companyId: string }>();
  const companyId = Array.isArray(params.companyId) ? params.companyId[0] : params.companyId;
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [offers, setOffers] = useState<OfferCardData[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      if (!isSupabaseMode) {
        initStorage();
        const data = getData();
        const localCompany = data.companies.find((item) => item.id === companyId) ?? null;
        const hotOfferIds = getHotOfferIds(data, 4);
        const localOffers =
          localCompany === null
            ? []
            : data.offers
                .filter((offer) => offer.companyId === localCompany.id && !offer.rejected)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((offer) => ({
                  id: offer.id,
                  companyId: offer.companyId,
                  title: offer.title,
                  description: offer.description,
                  discountLabel: offer.discountLabel,
                  category: offer.category,
                  neighborhood: offer.neighborhood,
                  images: offer.images,
                  isHot: hotOfferIds.has(offer.id),
                  companyName: localCompany.publicName ?? localCompany.name,
                  partnerLogoImage: localCompany.logoImage,
                  partnerCoverImage: localCompany.coverImage,
                  partnerAddressLine: localCompany.addressLine,
                  partnerInstagram: localCompany.instagram,
                  partnerFacebook: localCompany.facebook,
                  partnerWebsite: localCompany.website,
                  partnerWhatsapp: localCompany.whatsapp,
                }));

        if (!cancelled) {
          setCompany(localCompany);
          setOffers(localOffers);
          setLoading(false);
        }
        return;
      }

      if (!hasSupabaseEnv()) {
        if (!cancelled) {
          setCompany(null);
          setOffers([]);
          setLoading(false);
        }
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const [companyRes, offersRes, redemptionsRes] = await Promise.all([
        supabase
          .from("companies")
          .select(
            "id, name, public_name, category, neighborhood, city, state, approved, logo_image, cover_image, address_line, bio, instagram, facebook, website, whatsapp, created_at",
          )
          .eq("id", companyId)
          .maybeSingle<SupabaseCompanyRow>(),
        supabase
          .from("offers")
          .select("id, company_id, title, description, discount_label, category, neighborhood, images, rejected, created_at")
          .eq("company_id", companyId)
          .eq("rejected", false),
        supabase.from("redemptions").select("offer_id, status"),
      ]);

      if (companyRes.error || !companyRes.data || offersRes.error) {
        if (!cancelled) {
          setCompany(null);
          setOffers([]);
          setLoading(false);
        }
        return;
      }

      const mappedCompany = mapSupabaseCompany(companyRes.data);
      const redemptions = redemptionsRes.error
        ? []
        : ((redemptionsRes.data ?? []) as Array<{ offer_id: string; status: "generated" | "used" | "expired" }>);

      const usageScoreByOffer = redemptions
        .reduce<Record<string, number>>((acc, redemption) => {
          const score = redemption.status === "used" ? 2 : redemption.status === "generated" ? 1 : 0;
          if (score <= 0) return acc;
          acc[redemption.offer_id] = (acc[redemption.offer_id] ?? 0) + score;
          return acc;
        }, {});
      const hotOfferIds = new Set(
        Object.entries(usageScoreByOffer)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .filter(([, score]) => score > 0)
          .map(([offerId]) => offerId),
      );

      const mappedOffers = ((offersRes.data ?? []) as SupabaseOfferRow[])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((offer) => ({
          id: offer.id,
          companyId: offer.company_id,
          title: offer.title,
          description: offer.description,
          discountLabel: offer.discount_label,
          category: offer.category,
          neighborhood: offer.neighborhood,
          images: Array.isArray(offer.images) ? offer.images : [],
          isHot: hotOfferIds.has(offer.id),
          companyName: mappedCompany.publicName ?? mappedCompany.name,
          partnerLogoImage: mappedCompany.logoImage,
          partnerCoverImage: mappedCompany.coverImage,
          partnerAddressLine: mappedCompany.addressLine,
          partnerInstagram: mappedCompany.instagram,
          partnerFacebook: mappedCompany.facebook,
          partnerWebsite: mappedCompany.website,
          partnerWhatsapp: mappedCompany.whatsapp,
        }));

      if (!cancelled) {
        setCompany(mappedCompany);
        setOffers(mappedOffers);
        setLoading(false);
      }
    };

    void load().catch(() => {
      if (!cancelled) {
        setCompany(null);
        setOffers([]);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const hasCompany = useMemo(() => Boolean(company), [company]);

  if (loading) {
    return <main className="mx-auto grid min-h-screen w-full max-w-[1200px] gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-6">Carregando...</main>;
  }

  if (!hasCompany || !company) {
    return (
      <main className="mx-auto grid min-h-screen w-full max-w-[1200px] gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-6">
        <PublicPageHeader subtitle="Perfil público do parceiro" />
        <section className="card grid gap-2 text-center">
          <h1 className="m-0 text-2xl font-black text-[#102113]">Parceiro não encontrado</h1>
          <p className="m-0 text-sm text-[#486048]">
            Este perfil não existe ou ainda não está aprovado para exibição pública.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1400px] gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-6 xl:px-8">
      <PublicPageHeader subtitle="Perfil público do parceiro" />

      <section className="grid gap-3 rounded-2xl border border-[#d1dfd1] bg-white p-3 md:p-4">
        {company.coverImage ? (
          <Image
            src={company.coverImage}
            alt={`Capa de ${company.publicName ?? company.name}`}
            width={1200}
            height={240}
            unoptimized
            style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 14 }}
          />
        ) : null}
        <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
          <div>
            {company.logoImage ? (
              <Image
                src={company.logoImage}
                alt={`Logo de ${company.publicName ?? company.name}`}
                width={84}
                height={84}
                unoptimized
                style={{ width: 84, height: 84, borderRadius: 999, objectFit: "cover", border: "1px solid var(--line)" }}
              />
            ) : (
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 999,
                  border: "1px solid var(--line)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  color: "var(--muted)",
                }}
              >
                {(company.publicName ?? company.name).trim()[0]?.toUpperCase() ?? "P"}
              </div>
            )}
          </div>
          <div className="grid gap-1.5">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#2b7a3f]">Perfil do parceiro</p>
            <h1 className="m-0 text-3xl font-black leading-tight text-[#102113]">{company.publicName ?? company.name}</h1>
            <p className="m-0 text-sm text-[#486048]">
              {company.category} • {company.neighborhood} • {company.city}/{company.state}
            </p>
            <p className="m-0 text-sm text-[#486048]">
              {company.addressLine || `${company.neighborhood}, ${company.city}/${company.state}`}
            </p>
            {company.bio ? <p className="m-0 text-sm text-[#314634]">{company.bio}</p> : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {company.instagram ? (
            <a
              href={`https://instagram.com/${company.instagram.replace(/^@/, "").trim()}`}
              target="_blank"
              rel="noreferrer"
              className="badge badge-ok"
              style={{ textDecoration: "none" }}
            >
              Instagram: {company.instagram}
            </a>
          ) : null}
          {company.facebook ? (
            <a
              href={company.facebook.includes("facebook.com") ? ensureHttp(company.facebook) : `https://facebook.com/${company.facebook}`}
              target="_blank"
              rel="noreferrer"
              className="badge badge-ok"
              style={{ textDecoration: "none" }}
            >
              Facebook
            </a>
          ) : null}
          {company.website ? (
            <a href={ensureHttp(company.website)} target="_blank" rel="noreferrer" className="badge badge-ok" style={{ textDecoration: "none" }}>
              Site
            </a>
          ) : null}
          {company.whatsapp ? (
            <a
              href={`https://wa.me/${normalizePhone(company.whatsapp)}`}
              target="_blank"
              rel="noreferrer"
              className="badge badge-ok"
              style={{ textDecoration: "none" }}
            >
              WhatsApp
            </a>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 text-xl font-bold text-[#102113] md:text-2xl">Ofertas online deste parceiro</h2>
          <span className="badge badge-ok">{offers.length} oferta(s) ativa(s)</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} actionHref="/auth" actionLabel="Quero essa oferta" />
          ))}
        </div>
        {offers.length === 0 ? (
          <article className="card">
            <p className="m-0 text-sm text-[#486048]">Este parceiro ainda não possui ofertas online no momento.</p>
          </article>
        ) : null}
      </section>
    </main>
  );
}
