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
    <main className="relative mx-auto grid min-h-screen w-full max-w-[1200px] gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-6 overflow-hidden">
      {/* Blobs decorativos do background — identidade visual da home */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full opacity-60"
        style={{ background: "radial-gradient(circle, rgba(201,245,73,0.09) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full opacity-50"
        style={{ background: "radial-gradient(circle, rgba(201,245,73,0.06) 0%, transparent 70%)" }}
      />

      <PublicPageHeader subtitle={subtitle} />

      <section className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-soft)] md:p-6">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-1.5 w-8 rounded-full"
            style={{ background: "linear-gradient(90deg, #c9f549 0%, #a8d63a 100%)" }}
            aria-hidden="true"
          />
          <p
            className="m-0 text-xs font-bold uppercase tracking-[0.12em]"
            style={{ fontFamily: "var(--font-poppins), sans-serif", color: "var(--brand)" }}
          >
            {subtitle}
          </p>
        </div>
        <h1
          className="m-0 text-2xl md:text-3xl"
          style={{ fontFamily: "var(--font-poppins), sans-serif", fontWeight: 800, color: "#0f1a13", lineHeight: 1.2 }}
        >
          {title}
        </h1>
        <p className="m-0 text-sm md:text-base" style={{ fontFamily: "var(--font-dm), sans-serif", color: "var(--muted)", lineHeight: 1.6 }}>
          {description}
        </p>
      </section>

      <section className="card grid gap-3">{children}</section>
    </main>
  );
}
