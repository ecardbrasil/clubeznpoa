"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CarouselOffer {
  id: string;
  imageSrc: string;
  imageAlt: string;
  tag: string;
  title: string;
  description: string;
  brandLogoSrc: string | undefined;
  brandName: string;
  href: string;
}

interface HotOfferCardProps {
  offer: CarouselOffer;
}

const HotOfferCard = React.forwardRef<HTMLAnchorElement, HotOfferCardProps>(({ offer }, ref) => (
  <motion.a
    ref={ref}
    href={offer.href}
    className="relative flex-shrink-0 w-[300px] h-[380px] rounded-2xl overflow-hidden group snap-start"
    whileHover={{ y: -8 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    style={{ perspective: "1000px" }}
  >
    {/* Background Image */}
    <img
      src={offer.imageSrc}
      alt={offer.imageAlt}
      className="absolute inset-0 w-full h-2/4 object-cover transition-transform duration-500 group-hover:scale-110"
    />
    {/* Card Content */}
    <div className="absolute bottom-0 left-0 right-0 h-2/4 bg-white p-5 flex flex-col justify-between rounded-t-2xl border-t border-[var(--line)]">
      <div className="space-y-2">
        {/* Tag */}
        <div className="flex items-center text-xs text-[var(--muted)]">
          <Tag className="w-4 h-4 mr-2" style={{ color: "var(--brand)" }} />
          <span>{offer.tag}</span>
        </div>
        {/* Title & Description */}
        <h3 className="text-xl font-bold text-[#0f1a13] leading-tight" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
          {offer.title}
        </h3>
        <p className="text-sm text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
          {offer.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--line)]">
        <div className="flex items-center gap-3">
          {offer.brandLogoSrc && (
            <img
              src={offer.brandLogoSrc}
              alt={`${offer.brandName} logo`}
              className="w-8 h-8 rounded-full bg-[var(--panel)]"
            />
          )}
          <div>
            <p className="text-xs font-semibold text-[#0f1a13]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
              {offer.brandName}
            </p>
          </div>
        </div>
        <div
          className="w-8 h-8 rounded-full bg-[var(--panel)] flex items-center justify-center text-[var(--muted)] transform transition-all duration-300 group-hover:rotate-[-45deg] group-hover:bg-[var(--brand)] group-hover:text-white"
          style={{ cursor: "pointer" }}
        >
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  </motion.a>
));
HotOfferCard.displayName = "HotOfferCard";

interface HotOffersCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  offers: CarouselOffer[];
}

const HotOffersCarousel = React.forwardRef<HTMLDivElement, HotOffersCarouselProps>(
  ({ offers, className, ...props }, ref) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
      if (scrollContainerRef.current) {
        const { current } = scrollContainerRef;
        const scrollAmount = current.clientWidth * 0.8;
        current.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }
    };

    return (
      <div ref={ref} className={cn("relative w-full group", className)} {...props}>
        {/* Left Scroll Button */}
        <button
          onClick={() => scroll("left")}
          className="absolute top-1/2 -translate-y-1/2 left-0 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-[var(--line)] flex items-center justify-center text-[#0f1a13] opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/95 disabled:opacity-0"
          aria-label="Scroll Left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        >
          {offers.map((offer) => (
            <HotOfferCard key={offer.id} offer={offer} />
          ))}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll("right")}
          className="absolute top-1/2 -translate-y-1/2 right-0 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-[var(--line)] flex items-center justify-center text-[#0f1a13] opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/95 disabled:opacity-0"
          aria-label="Scroll Right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    );
  }
);
HotOffersCarousel.displayName = "HotOffersCarousel";

export { HotOffersCarousel };
