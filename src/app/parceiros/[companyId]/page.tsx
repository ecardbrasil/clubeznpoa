import { notFound } from "next/navigation";
import { OfferCard, type OfferCardData } from "@/components/offer-card";
import { PublicPageHeader } from "@/components/public-page-header";
import { PartnerProfileCard } from "@/components/partner/profile-card";
import { isSupabaseMode } from "@/lib/runtime-config";
import { getData, initStorage } from "@/lib/storage";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";
import { getHotOfferIds } from "@/lib/utils";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  if (!isSupabaseMode) return [];
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from("companies").select("id").eq("approved", true);
  return (data ?? []).map((row) => ({ companyId: row.id }));
}

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

async function getCompanyData(companyId: string): Promise<{ company: Company; offers: OfferCardData[] } | null> {
  if (!isSupabaseMode) {
    initStorage();
    const data = getData();
    const localCompany = data.companies.find((item) => item.id === companyId) ?? null;
    if (!localCompany) return null;
    const localOffers = data.offers
      .filter((offer) => offer.companyId === localCompany.id)
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
        isFeatured: false,
        isHot: getHotOfferIds(data, 4).has(offer.id),
        companyName: localCompany.publicName ?? localCompany.name,
        partnerLogoImage: localCompany.logoImage,
        partnerCoverImage: localCompany.coverImage,
        partnerAddressLine: localCompany.addressLine,
        partnerInstagram: localCompany.instagram,
        partnerFacebook: localCompany.facebook,
        partnerWebsite: localCompany.website,
        partnerWhatsapp: localCompany.whatsapp,
      }));
    return { company: localCompany, offers: localOffers };
  }

  const supabase = getSupabaseServerClient();
  const [companyRes, offersRes] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, public_name, category, neighborhood, city, state, approved, logo_image, cover_image, address_line, bio, instagram, facebook, website, whatsapp, created_at")
      .eq("id", companyId)
      .eq("approved", true)
      .maybeSingle<SupabaseCompanyRow>(),
    supabase
      .from("offers")
      .select("id, company_id, title, description, discount_label, category, neighborhood, images, rejected, created_at")
      .eq("company_id", companyId)
      .eq("approved", true)
      .eq("rejected", false),
  ]);

  if (companyRes.error || !companyRes.data || offersRes.error) return null;

  const mappedCompany = mapSupabaseCompany(companyRes.data);
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
      isFeatured: false,
      companyName: mappedCompany.publicName ?? mappedCompany.name,
      partnerLogoImage: mappedCompany.logoImage,
      partnerCoverImage: mappedCompany.coverImage,
      partnerAddressLine: mappedCompany.addressLine,
      partnerInstagram: mappedCompany.instagram,
      partnerFacebook: mappedCompany.facebook,
      partnerWebsite: mappedCompany.website,
      partnerWhatsapp: mappedCompany.whatsapp,
    }));

  return { company: mappedCompany, offers: mappedOffers };
}

export async function generateMetadata({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const result = await getCompanyData(companyId);
  if (!result) return {};
  const { company } = result;
  const name = company.publicName ?? company.name;
  const description = company.bio ?? `Confira as ofertas de ${name} no ClubeZN.`;
  return {
    title: `${name} | ClubeZN`,
    description,
    openGraph: { title: name, description, type: "profile" as const },
  };
}

export default async function PartnerPublicProfilePage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const result = await getCompanyData(companyId);

  if (!result) {
    notFound();
  }

  const { company, offers } = result;

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1400px] gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-6 xl:px-8">
      <PublicPageHeader />

      <PartnerProfileCard company={company} />

      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 text-xl md:text-2xl text-[#0f1a13]" style={{ fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700 }}>Ofertas online deste parceiro</h2>
          <span className="badge badge-ok">{offers.length} oferta(s) ativa(s)</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} actionHref="/auth" actionLabel="Quero essa oferta" />
          ))}
        </div>
        {offers.length === 0 ? (
          <article className="card">
            <p className="m-0 text-sm text-[var(--muted)]">Este parceiro ainda não possui ofertas online no momento.</p>
          </article>
        ) : null}
      </section>
    </main>
  );
}
