import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/runtime-config";
import { getData, initStorage } from "@/lib/storage";
import { PublicPageHeader } from "@/components/public-page-header";
import { PartnersListClient } from "@/components/partners-list-client";
import type { Company } from "@/lib/types";

export const revalidate = 3600;

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

async function getPartners(): Promise<PartnerListItem[]> {
  if (!isSupabaseMode) {
    initStorage();
    const data = getData();
    const offersCountByCompanyId = data.offers.reduce<Record<string, number>>((acc, offer) => {
      acc[offer.companyId] = (acc[offer.companyId] ?? 0) + 1;
      return acc;
    }, {});
    return data.companies
      .map((company) => ({ ...company, offersCount: offersCountByCompanyId[company.id] ?? 0 }))
      .sort((a, b) => {
        const byOffers = b.offersCount - a.offersCount;
        if (byOffers !== 0) return byOffers;
        return (a.publicName ?? a.name).localeCompare(b.publicName ?? b.name, "pt-BR");
      });
  }

  const supabase = getSupabaseServerClient();
  const [companiesRes, offersRes] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, public_name, category, neighborhood, city, state, approved, logo_image, cover_image, address_line, bio, instagram, facebook, website, whatsapp, created_at"),
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
}

export default async function PartnersPage() {
  const partners = await getPartners();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1400px] gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-6 xl:px-8">
      <PublicPageHeader />

      <section className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-soft)] md:p-5">
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-1 w-6 rounded-full"
              style={{ background: "linear-gradient(90deg, #c9f549 0%, #a8d63a 100%)" }}
              aria-hidden="true"
            />
            <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand)]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Rede de parceiros</p>
          </div>
          <h1 className="m-0 text-2xl md:text-3xl" style={{ fontFamily: "var(--font-poppins), sans-serif", fontWeight: 800, color: "#0f1a13" }}>Encontre empresas da rede ClubeZN</h1>
          <p className="m-0 text-sm text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
            Lista pública das empresas cadastradas e aprovadas na plataforma.
          </p>
        </div>

        <PartnersListClient partners={partners} />
      </section>
    </main>
  );
}
