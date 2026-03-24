import type { AppData } from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const getHotOfferIds = (data: Pick<AppData, "offers" | "redemptions">, maxItems = 3) => {
  const usageScoreByOffer = data.redemptions.reduce<Record<string, number>>((acc, redemption) => {
    const score = redemption.status === "used" ? 2 : redemption.status === "generated" ? 1 : 0;
    if (score <= 0) return acc;
    acc[redemption.offerId] = (acc[redemption.offerId] ?? 0) + score;
    return acc;
  }, {});

  const ranked = Object.entries(usageScoreByOffer)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxItems)
    .filter(([, score]) => score > 0)
    .map(([offerId]) => offerId);

  return new Set(ranked);
};
