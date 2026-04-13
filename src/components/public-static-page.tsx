import { ReactNode } from "react";
import { PublicPageHeader } from "@/components/public-page-header";

type PublicStaticPageProps = {
  subtitle: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PublicStaticPage({ subtitle, title, description, children }: PublicStaticPageProps) {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1200px] gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-6">
      <PublicPageHeader subtitle={subtitle} />

      <section className="grid gap-2 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-soft)] md:p-5">
        <h1 className="m-0 text-2xl font-black text-[#102113] md:text-3xl">{title}</h1>
        <p className="m-0 text-sm text-[var(--muted)] md:text-base">{description}</p>
      </section>

      <section className="card grid gap-2">{children}</section>
    </main>
  );
}
