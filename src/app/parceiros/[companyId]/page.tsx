"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { OfferCard, type OfferCardData } from "@/components/offer-card";
import { getData, initStorage } from "@/lib/storage";
import { getHotOfferIds } from "@/lib/utils";

const ensureHttp = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const normalizePhone = (value: string) => value.replace(/\D/g, "");

export default function PartnerPublicProfilePage() {
  const params = useParams<{ companyId: string }>();
  const companyId = Array.isArray(params.companyId) ? params.companyId[0] : params.companyId;

  const [data] = useState(() => {
    initStorage();
    return getData();
  });

  const hotOfferIds = useMemo(() => getHotOfferIds(data, 4), [data]);

  const company = useMemo(
    () => data.companies.find((item) => item.id === companyId && item.approved),
    [companyId, data.companies],
  );

  const offers = useMemo<OfferCardData[]>(() => {
    if (!company) return [];
    return data.offers
      .filter((offer) => offer.companyId === company.id && offer.approved)
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
        companyName: company.publicName ?? company.name,
        partnerLogoImage: company.logoImage,
        partnerCoverImage: company.coverImage,
        partnerAddressLine: company.addressLine,
        partnerInstagram: company.instagram,
        partnerFacebook: company.facebook,
        partnerWebsite: company.website,
        partnerWhatsapp: company.whatsapp,
      }));
  }, [company, data.offers, hotOfferIds]);

  if (!company) {
    return (
      <main className="mx-auto grid min-h-screen w-full max-w-[1200px] gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-6">
        <header className="rounded-2xl border border-[#d9e6db] bg-white px-3 py-3 md:px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BrandLogo />
            <Link href="/ofertas" className="btn btn-ghost !w-auto !px-4 !py-2 text-sm">
              Voltar para ofertas
            </Link>
          </div>
        </header>
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
      <header className="rounded-2xl border border-[#d9e6db] bg-white px-3 py-3 md:px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <Link href="/ofertas" className="btn btn-ghost !w-auto !px-4 !py-2 text-sm">
              Ver todas as ofertas
            </Link>
            <Link href="/auth" className="btn btn-primary !w-auto !px-4 !py-2 text-sm">
              Entrar
            </Link>
          </div>
        </div>
      </header>

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

