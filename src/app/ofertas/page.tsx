import { OffersPageClient } from "@/components/offers-page-client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getHotOfferIdsFromSupabase } from "@/lib/utils";
import type { OfferCardData } from "@/components/offer-card";

export const revalidate = 30;

type PublicOffer = OfferCardData & {
  companyId: string;
  createdAt: string;
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
  approved: boolean;
  logo_image: string | null;
  cover_image: string | null;
  address_line: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  whatsapp: string | null;
};

async function fetchOffers(): Promise<PublicOffer[]> {
  try {
    const supabase = getSupabaseServerClient();

    const [offersRes, companiesRes, redemptionsRes] = await Promise.all([
      supabase
        .from("offers")
        .select("id, company_id, title, description, discount_label, category, neighborhood, images, approved, rejected, created_at")
        .eq("approved", true)
        .eq("rejected", false),
      supabase
        .from("companies")
        .select("id, name, public_name, approved, logo_image, cover_image, address_line, instagram, facebook, website, whatsapp")
        .eq("approved", true),
      supabase.from("redemptions").select("offer_id, status"),
    ]);

    const offers = (offersRes.data ?? []) as SupabaseOfferRow[];
    const companies = (companiesRes.data ?? []) as SupabaseCompanyRow[];
    const redemptions = redemptionsRes.error
      ? []
      : ((redemptionsRes.data ?? []) as Array<{ offer_id: string; status: "generated" | "used" | "expired" }>);

    const companiesById = new Map(companies.map((c) => [c.id, c]));
    const hotOfferIds = getHotOfferIdsFromSupabase(redemptions, 4);

    return offers
      .filter((o) => companiesById.has(o.company_id))
      .map((o) => {
        const c = companiesById.get(o.company_id)!;
        return {
          id: o.id,
          companyId: o.company_id,
          createdAt: o.created_at,
          title: o.title,
          description: o.description,
          discountLabel: o.discount_label,
          isHot: hotOfferIds.has(o.id),
          category: o.category,
          neighborhood: o.neighborhood,
          images: Array.isArray(o.images) ? o.images : [],
          companyName: c.public_name ?? c.name ?? "Parceiro ClubeZN",
          partnerLogoImage: c.logo_image ?? undefined,
          partnerCoverImage: c.cover_image ?? undefined,
          partnerAddressLine: c.address_line ?? undefined,
          partnerInstagram: c.instagram ?? undefined,
          partnerFacebook: c.facebook ?? undefined,
          partnerWebsite: c.website ?? undefined,
          partnerWhatsapp: c.whatsapp ?? undefined,
        };
      });
  } catch {
    return [];
  }
}

export default async function OffersPage() {
  const initialOffers = await fetchOffers();
  return <OffersPageClient initialOffers={initialOffers} />;
}
