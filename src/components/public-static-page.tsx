import { ReactNode } from "react";
import { PublicPageHeader } from "@/components/public-page-header";
import { Footer } from "@/components/footer";

type PublicStaticPageProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function PublicStaticPage({title, description, children }: PublicStaticPageProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="relative mx-auto w-full max-w-[1200px] px-3 py-4 md:px-6 md:py-6">
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

        <PublicPageHeader />
      </div>

      <main className="relative mx-auto grid flex-1 w-full max-w-[1200px] gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-6 overflow-hidden">

        <section className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-soft)] md:p-6">
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

      <Footer />
    </div>
  );
}
