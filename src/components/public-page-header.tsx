import { SiteHeader } from "@/components/site-header";

type PublicPageHeaderProps = {
  smallLogo?: boolean;
  sticky?: boolean;
};

export function PublicPageHeader({ smallLogo = false, sticky = false }: PublicPageHeaderProps) {
  return <SiteHeader smallLogo={smallLogo} logoScale={1.2} sticky={sticky} className="border-[var(--line)] md:px-4" />;
}
