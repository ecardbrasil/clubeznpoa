"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PublicPageHeader } from "@/components/public-page-header";
import { isSupabaseMode } from "@/lib/runtime-config";
import { getData, initStorage } from "@/lib/storage";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { Company } from "@/lib/types";

type PartnerListItem = Company & { offersCount: number };

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
  company_id: string;
  approved: boolean;
  rejected: boolean;
};

const mapLocalPartners = (): PartnerListItem[] => {
  initStorage();
  const data = getData();

  const offersCountByCompanyId = data.offers
    .filter((offer) => offer.approved && !offer.rejected)
    .reduce<Record<string, number>>((acc, offer) => {
      acc[offer.companyId] = (acc[offer.companyId] ?? 0) + 1;
      return acc;
    }, {});

  return data.companies
    .filter((company) => company.approved)
    .map((company) => ({
      ...company,
      offersCount: offersCountByCompanyId[company.id] ?? 0,
    }))
    .sort((a, b) => {
      const byOffers = b.offersCount - a.offersCount;
      if (byOffers !== 0) return byOffers;
      return (a.publicName ?? a.name).localeCompare(b.publicName ?? b.name, "pt-BR");
    });
};

const mapSupabasePartners = async (): Promise<PartnerListItem[]> => {
  if (!hasSupabaseEnv()) {
    throw new Error("Variáveis do Supabase não configuradas.");
  }

  const supabase = getSupabaseBrowserClient();

  const [companiesRes, offersRes] = await Promise.all([
    supabase
      .from("companies")
      .select(
        "id, name, public_name, category, neighborhood, city, state, approved, logo_image, cover_image, address_line, bio, instagram, facebook, website, whatsapp, created_at",
      ),
    supabase.from("offers").select("company_id, approved, rejected"),
  ]);

  if (companiesRes.error) throw companiesRes.error;
  if (offersRes.error) throw offersRes.error;

  const companies = (companiesRes.data ?? []) as SupabaseCompanyRow[];
  const offers = (offersRes.data ?? []) as SupabaseOfferRow[];

  const offersCountByCompanyId = offers
    .filter((offer) => offer.approved && !offer.rejected)
    .reduce<Record<string, number>>((acc, offer) => {
      acc[offer.company_id] = (acc[offer.company_id] ?? 0) + 1;
      return acc;
    }, {});

  return companies
    .filter((company) => company.approved)
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
      createdAt: company.created_at,
      offersCount: offersCountByCompanyId[company.id] ?? 0,
    }))
    .sort((a, b) => {
      const byOffers = b.offersCount - a.offersCount;
      if (byOffers !== 0) return byOffers;
      return (a.publicName ?? a.name).localeCompare(b.publicName ?? b.name, "pt-BR");
    });
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<PartnerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setLoadingError("");
        const items = isSupabaseMode ? await mapSupabasePartners() : mapLocalPartners();
        if (!cancelled) setPartners(items);
      } catch (error) {
        if (!cancelled) {
          setPartners([]);
          setLoadingError(error instanceof Error ? error.message : "Falha ao carregar parceiros.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPartners = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return partners;
    return partners.filter((partner) =>
      [partner.publicName ?? partner.name, partner.category, partner.neighborhood, partner.city, partner.state]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [partners, query]);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1400px] gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-6 xl:px-8">
      <PublicPageHeader
        subtitle="Empresas parceiras cadastradas"
        actions={
          <>
            <Link href="/ofertas" className="btn btn-ghost !w-auto !px-4 !py-2 text-sm">
              Ver ofertas
            </Link>
            <Link href="/auth" className="btn btn-primary !w-auto !px-4 !py-2 text-sm">
              cadastro
            </Link>
          </>
        }
      />

      <section className="grid gap-3 rounded-2xl border border-[#d1dfd1] bg-white p-4 md:p-5">
        <div className="grid gap-1">
          <h1 className="m-0 text-2xl font-black text-[#102113] md:text-3xl">Encontre empresas da rede ClubeZN</h1>
          <p className="m-0 text-sm text-[#486048]">
            Lista pública das empresas cadastradas e aprovadas na plataforma.
          </p>
        </div>

        <label className="field">
          <span>Buscar empresa</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, categoria, bairro..."
          />
        </label>
      </section>

      {loadingError ? (
        <article className="rounded-2xl border border-[#f0c8c8] bg-[#fff2f2] px-3 py-2 text-sm text-[#7c2323]">
          Não foi possível carregar os parceiros. Detalhe: {loadingError}
        </article>
      ) : null}

      {loading ? (
        <section className="card">Carregando parceiros...</section>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPartners.map((partner) => (
            <article key={partner.id} className="card !grid !gap-2 !rounded-2xl !p-3">
              {partner.coverImage ? (
                <Image
                  alt={`Capa de ${partner.publicName ?? partner.name}`}
                  height={108}
                  src={partner.coverImage}
                  unoptimized
                  width={420}
                  style={{ width: "100%", height: 108, objectFit: "cover", borderRadius: 10 }}
                />
              ) : null}

              <div className="flex items-center gap-2">
                {partner.logoImage ? (
                  <Image
                    alt={`Logo de ${partner.publicName ?? partner.name}`}
                    height={40}
                    src={partner.logoImage}
                    unoptimized
                    width={40}
                    style={{ width: 40, height: 40, borderRadius: 999, objectFit: "cover", border: "1px solid var(--line)" }}
                  />
                ) : (
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d1dfd1] bg-[#f7faf7] text-sm font-black text-[#1f5f30]">
                    {(partner.publicName ?? partner.name).trim()[0]?.toUpperCase() ?? "P"}
                  </span>
                )}
                <div className="grid gap-0.5">
                  <p className="m-0 text-sm font-extrabold text-[#102113]">{partner.publicName ?? partner.name}</p>
                  <p className="m-0 text-xs text-[#486048]">{partner.category}</p>
                </div>
              </div>

              <p className="m-0 text-xs text-[#486048]">
                {partner.addressLine || `${partner.neighborhood} - ${partner.city}/${partner.state}`}
              </p>

              <div className="flex items-center justify-between gap-2">
                <span className="badge badge-ok">{partner.offersCount} oferta(s)</span>
                <Link href={`/parceiros/${partner.id}`} className="text-xs font-bold text-[#1f5f30] hover:underline">
                  Ver perfil da empresa
                </Link>
              </div>
            </article>
          ))}

          {filteredPartners.length === 0 && (
            <article className="card sm:col-span-2 xl:col-span-3">Nenhuma empresa encontrada para o filtro informado.</article>
          )}
        </section>
      )}
    </main>
  );
}
