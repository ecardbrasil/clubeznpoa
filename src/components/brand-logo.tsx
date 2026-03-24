import Link from "next/link";
import Image from "next/image";

interface BrandLogoProps {
  href?: string;
  small?: boolean;
}

export function BrandLogo({ href = "/", small = false }: BrandLogoProps) {
  const logoSize = small ? "h-7 w-auto md:h-8" : "h-8 w-auto md:h-10";

  return (
    <Link href={href} className="inline-flex items-center no-underline" aria-label="ClubeZN">
      <Image src="/clubezn-logo.svg" alt="ClubeZN" width={188} height={40} priority className={logoSize} />
    </Link>
  );
}
