"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="clubezn-shell grid place-items-center gap-3 py-24 text-center">
      <h1 className="m-0 text-2xl font-bold">Não conseguimos carregar agora</h1>
      <p className="m-0 text-sm text-[var(--muted)]">Tivemos um problema temporário. Tente novamente em instantes.</p>
      <button type="button" onClick={reset} className="btn btn-primary !w-auto !px-5">
        Tentar novamente
      </button>
    </main>
  );
}
