"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowUpRight, MapPin, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OfferCardData } from "@/components/offer-card";

interface FeaturedOfferCardProps {
  offer: OfferCardData;
  onClick?: () => void;
}

const FeaturedOfferCard = React.forwardRef<HTMLDivElement, FeaturedOfferCardProps>(
  ({ offer, onClick }, ref) => {
    const imageSrc = offer.images?.[0] ?? offer.partnerCoverImage ?? "";
    const hasImage = Boolean(imageSrc);

    return (
      <motion.div
        ref={ref}
        onClick={onClick}
        className="relative flex-shrink-0 w-[480px] h-[200px] rounded-2xl overflow-hidden group snap-start cursor-pointer border border-[var(--line)] bg-white shadow-[var(--shadow-soft)]"
        whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.10)" }}
        transition={{ type: "spring", stiffness: 340, damping: 22 }}
      >
        <div className="flex h-full">
          {/* Image — left 40% */}
          <div className="relative w-[40%] flex-shrink-0 overflow-hidden bg-[var(--panel)]">
            {hasImage ? (
              <img
                src={imageSrc}
                alt={offer.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--brand-muted,#e6f4ea)] to-[var(--panel)]">
                <Tag className="w-10 h-10 text-[var(--brand)] opacity-40" />
              </div>
            )}

            {/* Discount badge overlay */}
            <div className="absolute top-3 left-3">
              <span
                className="badge badge-accent"
                style={{ fontSize: 11, padding: "3px 10px", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700 }}
              >
                {offer.discountLabel}
              </span>
            </div>
          </div>

          {/* Content — right 60% */}
          <div className="flex flex-1 flex-col justify-between p-4 min-w-0">
            <div className="space-y-1 min-w-0">
              {/* Category + neighborhood */}
              <div className="flex items-center gap-2 text-xs text-[var(--muted)] flex-wrap">
                <span
                  className="flex items-center gap-1"
                  style={{ fontFamily: "var(--font-dm), sans-serif" }}
                >
                  <Tag className="w-3 h-3 flex-shrink-0" style={{ color: "var(--brand)" }} />
                  {offer.category}
                </span>
                {offer.neighborhood && (
                  <>
                    <span className="text-[var(--line)]">·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {offer.neighborhood}
                    </span>
                  </>
                )}
              </div>

              {/* Title */}
              <h3
                className="text-base font-bold text-[#0f1a13] leading-tight line-clamp-2"
                style={{ fontFamily: "var(--font-poppins), sans-serif" }}
              >
                {offer.title}
              </h3>

              {/* Description */}
              <p
                className="text-xs text-[var(--muted)] line-clamp-2"
                style={{ fontFamily: "var(--font-dm), sans-serif" }}
              >
                {offer.description}
              </p>
            </div>

            {/* Footer: logo + name + arrow */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--line)] mt-2">
              <div className="flex items-center gap-2 min-w-0">
                {offer.partnerLogoImage ? (
                  <img
                    src={offer.partnerLogoImage}
                    alt={offer.companyName}
                    className="w-7 h-7 rounded-full object-cover bg-[var(--panel)] flex-shrink-0 border border-[var(--line)]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[var(--panel)] flex-shrink-0 flex items-center justify-center border border-[var(--line)]">
                    <span className="text-[9px] font-bold text-[var(--muted)]">
                      {offer.companyName.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <p
                  className="text-xs font-semibold text-[#0f1a13] truncate"
                  style={{ fontFamily: "var(--font-poppins), sans-serif" }}
                >
                  {offer.companyName}
                </p>
              </div>

              <div
                className="w-7 h-7 rounded-full bg-[var(--panel)] flex items-center justify-center text-[var(--muted)] flex-shrink-0 transition-all duration-300 group-hover:bg-[var(--brand)] group-hover:text-white"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);
FeaturedOfferCard.displayName = "FeaturedOfferCard";

interface FeaturedOffersCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  offers: OfferCardData[];
  onCardClick?: (offer: OfferCardData) => void;
}

const FeaturedOffersCarousel = React.forwardRef<HTMLDivElement, FeaturedOffersCarouselProps>(
  ({ offers, onCardClick, className, ...props }, ref) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const scrollAmount = container.clientWidth * 0.75;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    };

    return (
      <div ref={ref} className={cn("relative w-full group", className)} {...props}>
        <button
          onClick={() => scroll("left")}
          className="absolute top-1/2 -translate-y-1/2 -left-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-[var(--line)] flex items-center justify-center text-[#0f1a13] opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white shadow-sm"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        >
          {offers.map((offer) => (
            <FeaturedOfferCard
              key={offer.id}
              offer={offer}
              onClick={() => onCardClick?.(offer)}
            />
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute top-1/2 -translate-y-1/2 -right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-[var(--line)] flex items-center justify-center text-[#0f1a13] opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white shadow-sm"
          aria-label="Próximo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }
);
FeaturedOffersCarousel.displayName = "FeaturedOffersCarousel";

export { FeaturedOffersCarousel };
export type { FeaturedOffersCarouselProps };
