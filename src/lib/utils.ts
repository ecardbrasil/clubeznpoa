import type { AppData } from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const getHotOfferIds = (data: Pick<AppData, "offers" | "redemptions">, maxItems = 3) => {
  const ranked = Object.entries(getUsageScoreByOffer(data.redemptions))
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxItems)
    .filter(([, score]) => score > 0)
    .map(([offerId]) => offerId);

  return new Set(ranked);
};

export const getUsageScoreByOffer = (
  redemptions: Array<{ offerId: string; status: "generated" | "used" | "expired" }>,
) =>
  redemptions.reduce<Record<string, number>>((acc, redemption) => {
    const score = redemption.status === "used" ? 2 : redemption.status === "generated" ? 1 : 0;
    if (score <= 0) return acc;
    acc[redemption.offerId] = (acc[redemption.offerId] ?? 0) + score;
    return acc;
  }, {});

export const getHotOfferIdsFromSupabase = (
  redemptions: Array<{ offer_id: string; status: "generated" | "used" | "expired" }>,
  maxItems = 3,
) => {
  const normalized = redemptions.map((item) => ({ offerId: item.offer_id, status: item.status }));
  const ranked = Object.entries(getUsageScoreByOffer(normalized))
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxItems)
    .filter(([, score]) => score > 0)
    .map(([offerId]) => offerId);
  return new Set(ranked);
};

export const parseDiscountSortWeight = (value: string) => {
  const normalized = value.replace(",", ".").trim();
  const percentMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch) return Number(percentMatch[1]);

  const currencyMatch = normalized.match(/R\$\s*(\d+(?:\.\d+)?)/i);
  if (currencyMatch) return Number(currencyMatch[1]);

  const genericNumber = normalized.match(/(\d+(?:\.\d+)?)/);
  if (genericNumber) return Number(genericNumber[1]);

  return Number.NEGATIVE_INFINITY;
};
