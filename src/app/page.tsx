import { HomePageClient } from "@/components/home-page-client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getHotOfferIdsFromSupabase } from "@/lib/utils";
import type { OfferCardData } from "@/components/offer-card";
import type { Company } from "@/lib/types";

export const revalidate = 60;

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

async function fetchLandingData() {
  try {
    const supabase = getSupabaseServerClient();

    const [offersRes, companiesRes, redemptionsRes] = await Promise.all([
      supabase
        .from("offers")
        .select("id, company_id, title, description, discount_label, category, neighborhood, images, approved, rejected")
        .eq("approved", true)
        .eq("rejected", false),
      supabase
        .from("companies")
        .select("id, name, public_name, category, neighborhood, city, state, approved, logo_image, cover_image, address_line, bio, instagram, facebook, website, whatsapp")
        .eq("approved", true),
      supabase.from("redemptions").select("offer_id, status"),
    ]);

    const offers = (offersRes.data ?? []) as SupabaseOfferRow[];
    const companies = (companiesRes.data ?? []) as SupabaseCompanyRow[];
    const redemptions = redemptionsRes.error ? [] : (redemptionsRes.data ?? []);

    const companiesById = new Map(companies.map((c) => [c.id, c]));
    const hotOfferIds = getHotOfferIdsFromSupabase(redemptions, 3);

    const offerCountByCompanyId = offers.reduce<Record<string, number>>((acc, o) => {
      if (companiesById.has(o.company_id)) acc[o.company_id] = (acc[o.company_id] ?? 0) + 1;
      return acc;
    }, {});

    const approvedOffers = offers.filter((o) => companiesById.has(o.company_id));

    const mapOffer = (o: SupabaseOfferRow): OfferCardData => {
      const c = companiesById.get(o.company_id)!;
      return {
        id: o.id,
        companyId: o.company_id,
        title: o.title,
        description: o.description,
        discountLabel: o.discount_label,
        category: o.category,
        neighborhood: o.neighborhood,
        isHot: hotOfferIds.has(o.id),
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
    };

    const trendingOffers: OfferCardData[] = approvedOffers.slice(0, 8).map(mapOffer);
    const featuredOffers: OfferCardData[] = approvedOffers.slice(8, 12).map(mapOffer);

    const partnerProfiles: Company[] = Array.from(companiesById.values())
      .sort((a, b) => {
        const diff = (offerCountByCompanyId[b.id] ?? 0) - (offerCountByCompanyId[a.id] ?? 0);
        return diff !== 0
          ? diff
          : (a.public_name ?? a.name).localeCompare(b.public_name ?? b.name, "pt-BR");
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

    return { trendingOffers, featuredOffers, partnerProfiles };
  } catch {
    return { trendingOffers: [], featuredOffers: [], partnerProfiles: [] };
  }
}

export default async function Page() {
  const initialData = await fetchLandingData();
  return <HomePageClient initialData={initialData} />;
}
