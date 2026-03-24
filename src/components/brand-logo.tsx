import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  small?: boolean;
}

export function BrandLogo({ href = "/", small = false }: BrandLogoProps) {
  const iconSize = small ? "h-8 w-8 text-xl" : "h-8 w-8 text-xl md:h-10 md:w-10 md:text-2xl";
  const textSize = small ? "text-3xl" : "text-3xl md:text-4xl";

  return (
    <Link href={href} className="inline-flex items-center gap-2 no-underline" aria-label="ClubeZN">
      <span
        className={`inline-flex ${iconSize} items-center justify-center bg-lime-400 font-black leading-none text-zinc-900`}
        style={{ borderRadius: 2 }}
      >
        C
      </span>
      <span className={`${textSize} font-extrabold leading-none text-zinc-900`}>
        ClubeZN
      </span>
    </Link>
  );
}
