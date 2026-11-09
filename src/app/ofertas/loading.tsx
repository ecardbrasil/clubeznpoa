import { PublicPageHeader } from "@/components/public-page-header";

export default function Loading() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1400px] content-start gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-6 xl:px-8" aria-busy="true" aria-label="Carregando">
      <PublicPageHeader />
      <div className="h-12 animate-pulse rounded-full bg-[var(--line)]" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-[var(--line)]" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-4">
            <div className="aspect-video animate-pulse rounded-xl bg-[var(--line)]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--line)]" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--line)]" />
            <div className="h-9 animate-pulse rounded-full bg-[var(--line)]" />
          </div>
        ))}
      </div>
    </main>
  );
}
