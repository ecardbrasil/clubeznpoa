import { SiteHeader } from "@/components/site-header";

type PublicPageHeaderProps = {
  subtitle?: string;
  smallLogo?: boolean;
  sticky?: boolean;
};

export function PublicPageHeader({ subtitle, smallLogo = false, sticky = false }: PublicPageHeaderProps) {
  return (
    <SiteHeader subtitle={subtitle} smallLogo={smallLogo} sticky={sticky} className="rounded-2xl border-[var(--line)] md:px-4" />
  );
}
