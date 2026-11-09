import { SiteHeader } from "@/components/site-header";

type PublicPageHeaderProps = {
  smallLogo?: boolean;
  sticky?: boolean;
};

export function PublicPageHeader({ smallLogo = true, sticky = false }: PublicPageHeaderProps) {
  return <SiteHeader smallLogo={smallLogo} logoScale={1.2} sticky={sticky} />;
}
