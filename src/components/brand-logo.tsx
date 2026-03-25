"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface BrandLogoProps {
  href?: string;
  small?: boolean;
}

export function BrandLogo({ href = "/", small = false }: BrandLogoProps) {
  const [imgError, setImgError] = useState(false);
  const logoSize = small ? "h-7 w-auto md:h-8" : "h-8 w-auto md:h-10";
  const fallbackIconSize = small ? "h-7 w-7 text-base" : "h-8 w-8 text-lg md:h-10 md:w-10 md:text-xl";
  const fallbackTextSize = small ? "text-2xl" : "text-2xl md:text-3xl";

  return (
    <Link href={href} className="inline-flex items-center no-underline" aria-label="ClubeZN">
      {!imgError ? (
        <Image
          src="/brand/clubezn-logo.webp"
          alt="ClubeZN"
          width={192}
          height={67}
          priority
          className={logoSize}
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="inline-flex items-center gap-2">
          <span
            className={`inline-flex ${fallbackIconSize} items-center justify-center bg-[#C9F549] font-black leading-none text-[#0A140E]`}
            style={{ borderRadius: 2 }}
          >
            C
          </span>
          <span className={`${fallbackTextSize} font-extrabold leading-none text-[#0A140E]`}>ClubeZN</span>
        </span>
      )}
    </Link>
  );
}
