"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Company } from "@/lib/types";

type PartnerListItem = Company & { offersCount: number };

export function PartnersListClient({ partners }: { partners: PartnerListItem[] }) {
  const [query, setQuery] = useState("");

  const filteredPartners = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return partners;
    return partners.filter((partner) =>
      [partner.publicName ?? partner.name, partner.category, partner.neighborhood, partner.city, partner.state]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [partners, query]);

  return (
    <>
      <label className="field">
        <span>Buscar empresa</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nome, categoria, bairro..."
        />
      </label>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filteredPartners.map((partner) => (
          <article key={partner.id} className="card !grid !gap-2 !rounded-2xl !p-3">
            {partner.coverImage ? (
              <Image
                alt={`Capa de ${partner.publicName ?? partner.name}`}
                height={108}
                src={partner.coverImage}
                unoptimized
                width={420}
                style={{ width: "100%", height: 108, objectFit: "cover", borderRadius: 10 }}
              />
            ) : null}

            <div className="flex items-center gap-2">
              {partner.logoImage ? (
                <Image
                  alt={`Logo de ${partner.publicName ?? partner.name}`}
                  height={40}
                  src={partner.logoImage}
                  unoptimized
                  width={40}
                  style={{ width: 40, height: 40, borderRadius: 999, objectFit: "cover", border: "1px solid var(--line)" }}
                />
              ) : (
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-[#0f1a13]"
                  style={{ background: "linear-gradient(135deg, #c9f549 0%, #a8d63a 100%)", fontFamily: "var(--font-poppins), sans-serif" }}
                >
                  {(partner.publicName ?? partner.name).trim()[0]?.toUpperCase() ?? "P"}
                </span>
              )}
              <div className="grid gap-0.5">
                <p className="m-0 text-sm font-bold text-[#0f1a13]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>{partner.publicName ?? partner.name}</p>
                <p className="m-0 text-xs text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>{partner.category}</p>
              </div>
            </div>

            <p className="m-0 text-xs text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
              {partner.addressLine || `${partner.neighborhood} - ${partner.city}/${partner.state}`}
            </p>

            <div className="flex items-center justify-between gap-2">
              <span className="badge badge-ok">{partner.offersCount} oferta(s)</span>
              <Link href={`/parceiros/${partner.id}`} className="text-xs font-bold text-[var(--brand)] hover:underline" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
                Ver perfil da empresa
              </Link>
            </div>
          </article>
        ))}

        {filteredPartners.length === 0 && (
          <article className="card sm:col-span-2 xl:col-span-3">Nenhuma empresa encontrada para o filtro informado.</article>
        )}
      </section>
    </>
  );
}
