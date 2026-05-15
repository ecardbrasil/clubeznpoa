"use client";

import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Offer } from "@/lib/types";

export type OfferCardData = Pick<
  Offer,
  "id" | "companyId" | "title" | "description" | "discountLabel" | "category" | "neighborhood" | "images"
> & {
  companyName: string;
  isHot?: boolean;
  partnerLogoImage?: string;
  partnerCoverImage?: string;
  partnerAddressLine?: string;
  partnerInstagram?: string;
  partnerFacebook?: string;
  partnerWebsite?: string;
  partnerWhatsapp?: string;
};

type OfferCardProps = {
  offer: OfferCardData;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  variant?: "default" | "landing-carousel";
};

type PartnerSocial = {
  label: string;
  value: string;
  url: string;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

const ensureHttp = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const sanitizeHandle = (value: string) => value.trim().replace(/^@/, "");

const normalizePhone = (value: string) => value.replace(/\D/g, "");

const toRad = (value: number) => (value * Math.PI) / 180;

const distanceKmBetween = (from: Coordinates, to: Coordinates) => {
  const earthRadiusKm = 6371;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(address)}`,
    {
      headers: { "Accept-Language": "pt-BR" },
    },
  );

  if (!response.ok) return null;

  const payload = (await response.json()) as Array<{ lat: string; lon: string }>;
  const first = payload[0];
  if (!first) return null;

  const latitude = Number(first.lat);
  const longitude = Number(first.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
};

export function OfferCard({
  offer,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
  variant = "default",
}: OfferCardProps) {
  const [open, setOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [companyCoordinates, setCompanyCoordinates] = useState<Coordinates | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);

  const isLandingCarousel = variant === "landing-carousel";
  const imageCount = offer.images.length;
  const currentImage = imageCount > 0 ? offer.images[activeImageIndex % imageCount] : "";

  const isClickable = Boolean(actionHref || onAction || secondaryHref);

  const goPrev = () => {
    if (imageCount === 0) return;
    setActiveImageIndex((current) => (current - 1 + imageCount) % imageCount);
  };

  const goNext = () => {
    if (imageCount === 0) return;
    setActiveImageIndex((current) => (current + 1) % imageCount);
  };

  const primaryAction = () => {
    if (onAction) {
      onAction();
      setOpen(false);
      return;
    }

    if (actionHref) {
      setOpen(false);
    }
  };

  const modalAction = actionHref ? (
    <Link href={actionHref} className="btn btn-coupon !w-full text-center">
      {actionLabel}
    </Link>
  ) : (
    <button className="btn btn-coupon" type="button" onClick={primaryAction}>
      {actionLabel}
    </button>
  );

  const hasGallery = imageCount > 1;
  const subtitle = useMemo(
    () => `${offer.companyName} • ${offer.category} • ${offer.neighborhood}`,
    [offer.companyName, offer.category, offer.neighborhood],
  );
  const partnerProfileHref = `/parceiros/${offer.companyId}`;
  const mapEmbedUrl = useMemo(() => {
    if (!companyCoordinates) return "";

    const lat = companyCoordinates.latitude;
    const lon = companyCoordinates.longitude;
    const delta = 0.008;
    const bbox = `${lon - delta}%2C${lat - delta}%2C${lon + delta}%2C${lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
  }, [companyCoordinates]);
  const socialLinks = useMemo<PartnerSocial[]>(() => {
    const social: PartnerSocial[] = [];

    if (offer.partnerInstagram?.trim()) {
      const handle = sanitizeHandle(offer.partnerInstagram);
      if (handle) {
        social.push({
          label: "Instagram",
          value: offer.partnerInstagram,
          url: `https://instagram.com/${handle}`,
        });
      }
    }

    if (offer.partnerFacebook?.trim()) {
      const profile = offer.partnerFacebook.trim();
      social.push({
        label: "Facebook",
        value: profile,
        url: profile.includes("facebook.com") ? ensureHttp(profile) : `https://facebook.com/${sanitizeHandle(profile)}`,
      });
    }

    if (offer.partnerWebsite?.trim()) {
      social.push({
        label: "Site",
        value: offer.partnerWebsite,
        url: ensureHttp(offer.partnerWebsite),
      });
    }

    if (offer.partnerWhatsapp?.trim()) {
      const digits = normalizePhone(offer.partnerWhatsapp);
      if (digits) {
        social.push({
          label: "WhatsApp",
          value: offer.partnerWhatsapp,
          url: `https://wa.me/${digits}`,
        });
      }
    }

    return social;
  }, [offer.partnerFacebook, offer.partnerInstagram, offer.partnerWebsite, offer.partnerWhatsapp]);

  useEffect(() => {
    if (!open) return () => undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    let cancelled = false;

    if (!open || !offer.partnerAddressLine?.trim()) {
      setCompanyCoordinates(null);
      setMapLoading(false);
      setDistanceKm(null);
      setDistanceLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setMapLoading(true);
    void (async () => {
      try {
        const coordinates = await geocodeAddress(offer.partnerAddressLine ?? "");
        if (!cancelled) {
          setCompanyCoordinates(coordinates);
        }
      } catch {
        if (!cancelled) {
          setCompanyCoordinates(null);
        }
      } finally {
        if (!cancelled) {
          setMapLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [offer.partnerAddressLine, open]);

  useEffect(() => {
    let cancelled = false;

    if (!open || !companyCoordinates || !offer.partnerAddressLine?.trim()) {
      setDistanceKm(null);
      setDistanceLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (!("geolocation" in navigator)) {
      setDistanceKm(null);
      setDistanceLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setDistanceLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoordinates: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        const value = distanceKmBetween(userCoordinates, companyCoordinates);
        if (!cancelled) {
          setDistanceKm(value);
          setDistanceLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setDistanceKm(null);
          setDistanceLoading(false);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 30 * 60 * 1000,
      },
    );

    return () => {
      cancelled = true;
    };
  }, [companyCoordinates, offer.partnerAddressLine, open]);

  return (
    <>
      <article
        className={`card offer-card-root ${isLandingCarousel ? "flex flex-col gap-3" : "!grid !gap-3 !rounded-2xl"} ${isClickable ? "cursor-pointer" : ""}`}
        onClick={() => setOpen(true)}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : -1}
        aria-haspopup={isClickable ? "dialog" : undefined}
        aria-expanded={isClickable ? open : undefined}
        aria-label={isClickable ? `Abrir detalhes da oferta ${offer.title}` : undefined}
        onKeyDown={(event) => {
          if (!isClickable) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        style={
          isLandingCarousel
            ? ({
                background: "transparent",
                border: "none",
                borderRadius: 0,
                boxShadow: "none",
                padding: 16,
                minHeight: 460,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              } satisfies CSSProperties)
            : undefined
        }
      >
        <div
          style={
            isLandingCarousel
              ? ({
                  position: "relative",
                  width: "calc(100% + 32px)",
                  margin: "-16px -16px 0",
                  aspectRatio: "1 / 1",
                  overflow: "hidden",
                  borderRadius: 16,
                  background: "#dfe5d4",
                } satisfies CSSProperties)
              : ({ position: "relative", overflow: "hidden", borderRadius: 12, aspectRatio: "4 / 3", background: "#eaefe4" } satisfies CSSProperties)
          }
        >
          {currentImage ? (
            <>
              <Image
                alt={`Capa da oferta ${offer.title}`}
                fill
                src={currentImage}
                unoptimized
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                style={{ objectFit: "cover", objectPosition: "center", borderRadius: isLandingCarousel ? 16 : 12 } satisfies CSSProperties}
              />
              {hasGallery ? (
                <>
                  <button
                    type="button"
                    aria-label="Foto anterior"
                    onClick={(event) => { event.stopPropagation(); goPrev(); }}
                    onMouseDown={(event) => event.preventDefault()}
                    style={{
                      position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                      width: 32, height: 32, borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.3)",
                      background: "rgba(0,0,0,0.5)", color: "white",
                      display: "grid", placeItems: "center", zIndex: 2, cursor: "pointer",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Próxima foto"
                    onClick={(event) => { event.stopPropagation(); goNext(); }}
                    onMouseDown={(event) => event.preventDefault()}
                    style={{
                      position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                      width: 32, height: 32, borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.3)",
                      background: "rgba(0,0,0,0.5)", color: "white",
                      display: "grid", placeItems: "center", zIndex: 2, cursor: "pointer",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <div
                    style={{
                      position: "absolute", bottom: 8, right: 8,
                      background: "rgba(0,0,0,0.55)", color: "white",
                      borderRadius: 999, padding: "2px 8px",
                      fontSize: 11, fontWeight: 700, zIndex: 2,
                    }}
                  >
                    {activeImageIndex + 1}/{imageCount}
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <div
              style={{
                position: "absolute", inset: 0, display: "grid", placeItems: "center",
                color: "var(--muted)", fontWeight: 700, fontSize: 12,
                background: "linear-gradient(135deg, rgba(255,255,255,0.55), rgba(223,229,212,0.85))",
              }}
            >
              Sem foto
            </div>
          )}
          <div style={{ position: "absolute", top: 8, left: 8, display: "grid", gap: 5, zIndex: 1 }}>
            <span className="badge badge-accent" style={{ fontSize: 12, padding: "4px 10px" }}>{offer.discountLabel}</span>
            {offer.isHot ? (
              <span className="badge" style={{ background: "rgba(15,26,19,0.82)", color: "#c9f549", fontSize: 11, padding: "3px 9px", backdropFilter: "blur(4px)" }}>
                🔥 Em alta
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {offer.partnerLogoImage ? (
            <Image
              alt={`Logo ${offer.companyName}`}
              src={offer.partnerLogoImage}
              width={22}
              height={22}
              unoptimized
              style={{ width: 22, height: 22, borderRadius: 999, objectFit: "cover", border: "1px solid var(--line)", flexShrink: 0 } satisfies CSSProperties}
            />
          ) : null}
          <span className="min-w-0 truncate text-xs font-semibold text-[var(--brand)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
            {offer.companyName}
          </span>
          <span className="shrink-0 text-xs text-[var(--muted)]" style={{ fontFamily: "var(--font-dm), sans-serif" }}>
            · {offer.neighborhood}
          </span>
        </div>
        <h4
          className="m-0 text-base leading-snug text-[#0f1a13]"
          style={
            isLandingCarousel
              ? ({
                  fontFamily: "var(--font-poppins), sans-serif",
                  fontWeight: 700,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                } satisfies CSSProperties)
              : ({
                  fontFamily: "var(--font-poppins), sans-serif",
                  fontWeight: 700,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                } satisfies CSSProperties)
          }
        >
          {offer.title}
        </h4>
        <p
          className="m-0 text-sm text-[var(--muted)]"
          style={({
            fontFamily: "var(--font-dm), sans-serif",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            ...(isLandingCarousel ? { minHeight: 40 } : {}),
          } satisfies CSSProperties)}
        >
          {offer.description}
        </p>
      </article>

      {open && (
        <section
          className="offer-modal-overlay"
          onClick={() => setOpen(false)}
        >
          <article
            className="card offer-modal-panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Detalhes da oferta ${offer.title}`}
          >
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start", position: "sticky", top: 0, background: "var(--panel)", zIndex: 2, padding: "4px 0 8px", borderBottom: "1px solid var(--line)", marginBottom: 4 }}>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 20, fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700, color: "#0f1a13", lineHeight: 1.25 }}>{offer.title}</h3>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-dm), sans-serif" }}>{subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar modal"
                style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: 999,
                  border: "1px solid var(--line)", background: "#fff",
                  display: "grid", placeItems: "center", cursor: "pointer",
                  color: "var(--muted)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className="offer-modal-grid">
              {/* Coluna de mídia */}
              <div className="offer-modal-media">
                {currentImage ? (
                  <div style={{ position: "relative", aspectRatio: "4/3", borderRadius: 14, overflow: "hidden", background: "#eaefe4" }}>
                    <Image
                      alt={`Imagem ${activeImageIndex + 1} da oferta ${offer.title}`}
                      fill
                      src={currentImage}
                      unoptimized
                      sizes="(max-width: 860px) 100vw, 400px"
                      style={{ objectFit: "cover" } satisfies CSSProperties}
                    />
                    {hasGallery && (
                      <>
                        <button
                          type="button"
                          aria-label="Foto anterior"
                          onClick={(event) => { event.stopPropagation(); goPrev(); }}
                          style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: 999, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(0,0,0,0.52)", color: "white", display: "grid", placeItems: "center", cursor: "pointer" }}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <button
                          type="button"
                          aria-label="Próxima foto"
                          onClick={(event) => { event.stopPropagation(); goNext(); }}
                          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: 999, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(0,0,0,0.52)", color: "white", display: "grid", placeItems: "center", cursor: "pointer" }}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.55)", color: "white", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                          {activeImageIndex + 1}/{imageCount}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ aspectRatio: "4/3", borderRadius: 14, border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--muted)", fontWeight: 700, background: "#f3f6f1" }}>
                    Oferta sem foto
                  </div>
                )}

                {/* Miniaturas da galeria */}
                {hasGallery && (
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                    {offer.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        style={{
                          flexShrink: 0, width: 52, height: 42, borderRadius: 8,
                          overflow: "hidden", padding: 0,
                          border: idx === activeImageIndex ? "2px solid #c9f549" : "2px solid var(--line)",
                          cursor: "pointer", background: "#eaefe4",
                        }}
                      >
                        <Image src={img} alt={`Miniatura ${idx + 1}`} width={52} height={42} unoptimized style={{ width: 52, height: 42, objectFit: "cover" } satisfies CSSProperties} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Coluna de detalhes */}
              <div className="offer-modal-details">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <span className="badge badge-accent" style={{ fontSize: 13 }}>{offer.discountLabel}</span>
                  {offer.isHot ? (
                    <span className="badge" style={{ background: "rgba(15,26,19,0.85)", color: "#c9f549", fontSize: 12, backdropFilter: "blur(4px)" }}>
                      🔥 Em alta
                    </span>
                  ) : null}
                </div>

                {modalAction}

                <p style={{ margin: 0, lineHeight: 1.65, fontFamily: "var(--font-dm), sans-serif", color: "var(--muted)", fontSize: 14 }}>{offer.description}</p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <span className="badge" style={{ background: "#f3f6f1", color: "var(--brand)", fontSize: 12, fontFamily: "var(--font-dm), sans-serif", fontWeight: 600 }}>
                    📍 {offer.neighborhood}
                  </span>
                  <span className="badge" style={{ background: "#f3f6f1", color: "var(--brand)", fontSize: 12, fontFamily: "var(--font-dm), sans-serif", fontWeight: 600 }}>
                    {offer.category}
                  </span>
                  {offer.partnerAddressLine ? (
                    <span className="badge" style={{ background: "#f3f6f1", color: "var(--brand)", fontSize: 12, fontFamily: "var(--font-dm), sans-serif", fontWeight: 600 }}>
                      🗺{" "}
                      {distanceLoading ? "calculando..." : distanceKm !== null ? `~${distanceKm.toFixed(1)} km` : "distância indisponível"}
                    </span>
                  ) : null}
                </div>

                {offer.partnerAddressLine && companyCoordinates && mapEmbedUrl ? (
                  <div className="card !grid !gap-2 !rounded-xl !p-2 !shadow-none">
                    <p style={{ margin: 0, fontSize: 11, color: "var(--muted)", fontWeight: 700, fontFamily: "var(--font-poppins), sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Localização
                    </p>
                    <iframe
                      title={`Mapa de ${offer.companyName}`}
                      src={mapEmbedUrl}
                      style={{ width: "100%", height: 160, border: "1px solid var(--line)", borderRadius: 10 }}
                      loading="lazy"
                    />
                  </div>
                ) : null}
                {offer.partnerAddressLine && mapLoading ? (
                  <div style={{ height: 160, borderRadius: 10, background: "#eaefe4", display: "grid", placeItems: "center", fontSize: 12, color: "var(--muted)" }}>
                    Carregando mapa...
                  </div>
                ) : null}

                {/* Perfil do parceiro */}
                <div className="card !grid !gap-2 !rounded-xl !p-3 !shadow-none" style={{ borderColor: "var(--line)" }}>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--muted)", fontWeight: 700, fontFamily: "var(--font-poppins), sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>Parceiro</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {offer.partnerLogoImage ? (
                      <Image
                        alt={`Logo de ${offer.companyName}`}
                        height={40}
                        src={offer.partnerLogoImage}
                        unoptimized
                        width={40}
                        style={{ width: 40, height: 40, borderRadius: 999, objectFit: "cover", border: "1px solid var(--line)", flexShrink: 0 } satisfies CSSProperties}
                      />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 999, background: "linear-gradient(135deg, #c9f549, #a8d63a)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#0f1a13" }}>{offer.companyName.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, fontFamily: "var(--font-poppins), sans-serif", color: "#0f1a13", lineHeight: 1.3 }}>{offer.companyName}</p>
                      {offer.neighborhood ? <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-dm), sans-serif" }}>{offer.neighborhood}</p> : null}
                    </div>
                  </div>
                  {offer.partnerCoverImage ? (
                    <Image
                      alt={`Capa de ${offer.companyName}`}
                      height={80}
                      src={offer.partnerCoverImage}
                      unoptimized
                      width={640}
                      style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 10 } satisfies CSSProperties}
                    />
                  ) : null}
                  {socialLinks.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {socialLinks.map((item) => (
                        <a
                          key={item.label}
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="badge badge-ok"
                          style={{ textDecoration: "none", fontSize: 12 }}
                        >
                          {item.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                  <Link href={partnerProfileHref} className="btn btn-ghost !w-full text-center" style={{ height: 38, fontSize: 13 }}>
                    Ver perfil completo →
                  </Link>
                </div>

                {secondaryHref ? (
                  <Link href={secondaryHref} className="btn btn-ghost !w-full text-center">
                    {secondaryLabel}
                  </Link>
                ) : secondaryLabel ? (
                  <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>
                    {secondaryLabel}
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        </section>
      )}
    </>
  );
}
