"use client";

import Image from "next/image";
import type { Company } from "@/lib/types";

const ensureHttp = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const normalizePhone = (value: string) => value.replace(/\D/g, "");

interface PartnerProfileCardProps {
  company: Company;
}

export function PartnerProfileCard({ company }: PartnerProfileCardProps) {
  const displayName = company.publicName ?? company.name;
  const initials = displayName.trim()[0]?.toUpperCase() ?? "P";

  return (
    <section className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-soft)] overflow-hidden">
      {/* ── Cover Image ── */}
      <div className="relative w-full aspect-[5/1] min-h-[120px] bg-gradient-to-br from-[#c9f549] via-[#a8d63a] to-[#7ab52a]">
        {company.coverImage ? (
          <Image
            src={company.coverImage}
            alt={`Capa de ${displayName}`}
            fill
            sizes="(max-width: 768px) 100vw, 1400px"
            className="object-cover"
            unoptimized
            loading="lazy"
          />
        ) : null}
        {/* Sutil gradiente overlay para legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      </div>

      {/* ── Avatar sobreposto + Conteúdo ── */}
      <div className="relative px-4 pb-4 md:px-5 md:pb-5">
        {/* Avatar sobreposto */}
        <div className="flex justify-start -mt-11 md:-mt-12 mb-3">
          {company.logoImage ? (
            <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden border-4 border-white shadow-md">
              <Image
                src={company.logoImage}
                alt={`Logo de ${displayName}`}
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
                loading="lazy"
              />
            </div>
          ) : (
            <div
              className="h-20 w-20 md:h-24 md:w-24 rounded-full border-4 border-white shadow-md"
              style={{
                background: "linear-gradient(135deg, #c9f549 0%, #a8d63a 100%)",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                color: "#0f1a13",
                fontSize: 28,
                fontFamily: "var(--font-poppins), sans-serif",
              }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* ── Info Section ── */}
        <div className="grid gap-1.5">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-1 w-5 rounded-full"
              style={{
                background: "linear-gradient(90deg, #c9f549 0%, #a8d63a 100%)",
              }}
              aria-hidden="true"
            />
            <p
              className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand)]"
              style={{ fontFamily: "var(--font-poppins), sans-serif" }}
            >
              Perfil do parceiro
            </p>
          </div>

          <h1
            className="m-0 text-2xl leading-tight text-[#0f1a13] md:text-3xl"
            style={{ fontFamily: "var(--font-poppins), sans-serif", fontWeight: 800 }}
          >
            {displayName}
          </h1>

          <p className="m-0 text-sm text-[var(--muted)]">
            {company.category} &bull; {company.neighborhood} &bull; {company.city}/{company.state}
          </p>

          <p className="m-0 text-sm text-[var(--muted)]">
            {company.addressLine || `${company.neighborhood}, ${company.city}/${company.state}`}
          </p>

          {/* ── Bio ── */}
          {company.bio ? (
            <div className="mt-1 rounded-xl bg-[#f0f5ec] border border-[#dfe5d4] px-4 py-3">
              <p className="m-0 text-sm leading-relaxed text-[#314634] italic">
                &ldquo;{company.bio}&rdquo;
              </p>
            </div>
          ) : null}
        </div>

        {/* ── Social Links ── */}
        <div className="flex flex-wrap gap-2 mt-3">
          {company.instagram ? (
            <a
              href={`https://instagram.com/${company.instagram.replace(/^@/, "").trim()}`}
              target="_blank"
              rel="noreferrer"
              className="badge badge-ok"
              style={{ textDecoration: "none" }}
            >
              Instagram: {company.instagram}
            </a>
          ) : null}
          {company.facebook ? (
            <a
              href={
                company.facebook.includes("facebook.com")
                  ? ensureHttp(company.facebook)
                  : `https://facebook.com/${company.facebook}`
              }
              target="_blank"
              rel="noreferrer"
              className="badge badge-ok"
              style={{ textDecoration: "none" }}
            >
              Facebook
            </a>
          ) : null}
          {company.website ? (
            <a
              href={ensureHttp(company.website)}
              target="_blank"
              rel="noreferrer"
              className="badge badge-ok"
              style={{ textDecoration: "none" }}
            >
              Site
            </a>
          ) : null}
          {company.whatsapp ? (
            <a
              href={`https://wa.me/${normalizePhone(company.whatsapp)}`}
              target="_blank"
              rel="noreferrer"
              className="badge badge-ok"
              style={{ textDecoration: "none" }}
            >
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}