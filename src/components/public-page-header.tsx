import { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";

type PublicPageHeaderProps = {
  subtitle?: string;
  actions?: ReactNode;
  smallLogo?: boolean;
};

export function PublicPageHeader({ subtitle, actions, smallLogo = false }: PublicPageHeaderProps) {
  return (
    <header className="rounded-2xl border border-[#d9e6db] bg-white px-3 py-3 md:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <BrandLogo small={smallLogo} />
          {subtitle ? <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[#486048]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
