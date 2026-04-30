import { SiteHeader } from "@/components/site-header";

type PublicPageHeaderProps = {
  smallLogo?: boolean;
  sticky?: boolean;
};

export function PublicPageHeader({ smallLogo = false, sticky = false }: PublicPageHeaderProps) {
  return (
    <SiteHeader smallLogo={smallLogo} sticky={sticky} className="rounded-2xl border-[var(--line)] md:px-4" />
  );
}
