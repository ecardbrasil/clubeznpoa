"use client";

import Link from "next/link";
import Image from "next/image";
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
}: OfferCardProps) {
  const [open, setOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [companyCoordinates, setCompanyCoordinates] = useState<Coordinates | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);

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
    <Link href={actionHref} className="btn btn-primary !w-full text-center">
      {actionLabel}
    </Link>
  ) : (
    <button className="btn btn-primary" type="button" onClick={primaryAction}>
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
        className={`card !grid !gap-3 !rounded-2xl ${isClickable ? "cursor-pointer" : ""}`}
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
      >
        {currentImage ? (
          <div style={{ position: "relative" }}>
            <Image
              alt={`Capa da oferta ${offer.title}`}
              height={120}
              src={currentImage}
              unoptimized
              width={320}
              style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10 }}
            />
            {offer.isHot ? (
              <span
                className="badge"
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  background: "#c12b2b",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.65)",
                }}
              >
                Quente agora
              </span>
            ) : null}
            {hasGallery && (
              <div
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 8,
                  background: "rgba(0,0,0,0.55)",
                  color: "white",
                  borderRadius: 999,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {imageCount} fotos
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              height: 120,
              borderRadius: 10,
              border: "1px solid var(--line)",
              display: "grid",
              placeItems: "center",
              color: "var(--muted)",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            Sem foto
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-xs text-[#486048]">
          <span className="badge badge-ok">{offer.discountLabel}</span>
          <span>{offer.neighborhood}</span>
        </div>
        <h4 className="m-0 text-lg font-extrabold leading-tight text-[#102113]">{offer.title}</h4>
        <p className="m-0 text-sm text-[#486048]">{offer.description}</p>
        <div className="grid gap-1.5">
          <div className="flex items-center gap-2">
            {offer.partnerLogoImage ? (
              <Image
                alt={`Logo de ${offer.companyName}`}
                height={28}
                src={offer.partnerLogoImage}
                unoptimized
                width={28}
                style={{ width: 28, height: 28, borderRadius: 999, objectFit: "cover", border: "1px solid var(--line)" }}
              />
            ) : null}
            <Link
              href={partnerProfileHref}
              onClick={(event) => event.stopPropagation()}
              className="m-0 text-xs font-semibold uppercase tracking-wide text-[#486048] hover:text-[#1f5f30] hover:underline"
            >
              {subtitle}
            </Link>
          </div>
          {offer.partnerAddressLine ? (
            <p className="m-0 text-xs text-[#486048]">{offer.partnerAddressLine}</p>
          ) : null}
        </div>
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
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 22 }}>{offer.title}</h3>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>{subtitle}</p>
                </div>
              <button
                className="btn btn-ghost"
                onClick={() => setOpen(false)}
                style={{ width: "auto", padding: "6px 10px", flexShrink: 0 }}
                type="button"
                >
                  Fechar
                </button>
              </div>

            <div className="offer-modal-grid">
              <div className="offer-modal-media">
                {currentImage ? (
                  <div style={{ position: "relative" }}>
                    <Image
                      alt={`Imagem ${activeImageIndex + 1} da oferta ${offer.title}`}
                      height={200}
                      src={currentImage}
                      unoptimized
                      width={400}
                      style={{ width: "100%", height: 240, objectFit: "cover", borderRadius: 14 }}
                    />
                    {hasGallery && (
                      <>
                        <button
                          className="btn"
                          onClick={goPrev}
                          style={{
                            position: "absolute",
                            left: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.55)",
                            color: "white",
                            padding: 0,
                          }}
                          type="button"
                        >
                          {"<"}
                        </button>
                        <button
                          className="btn"
                          onClick={goNext}
                          style={{
                            position: "absolute",
                            right: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.55)",
                            color: "white",
                            padding: 0,
                          }}
                          type="button"
                        >
                          {">"}
                        </button>
                        <div
                          style={{
                            position: "absolute",
                            bottom: 10,
                            right: 10,
                            background: "rgba(0,0,0,0.55)",
                            color: "white",
                            borderRadius: 999,
                            padding: "2px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {activeImageIndex + 1}/{imageCount}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: 240,
                      borderRadius: 14,
                      border: "1px solid var(--line)",
                      display: "grid",
                      placeItems: "center",
                      color: "var(--muted)",
                      fontWeight: 700,
                    }}
                  >
                    Oferta sem foto
                  </div>
                )}
              </div>

              <div className="offer-modal-details">
                {offer.isHot ? (
                  <span className="badge" style={{ width: "fit-content", background: "#c12b2b", color: "#fff" }}>
                    Oferta em alta
                  </span>
                ) : null}
                {offer.partnerCoverImage ? (
                  <Image
                    alt={`Capa de ${offer.companyName}`}
                    height={96}
                    src={offer.partnerCoverImage}
                    unoptimized
                    width={640}
                    style={{ width: "100%", height: 96, objectFit: "cover", borderRadius: 12 }}
                  />
                ) : null}
                <span className="badge badge-ok" style={{ width: "fit-content" }}>
                  {offer.discountLabel}
                </span>
                <p style={{ margin: 0, lineHeight: 1.5 }}>{offer.description}</p>
                <div className="offer-modal-metadata">
                  <span>Bairro: {offer.neighborhood}</span>
                  <span>Categoria: {offer.category}</span>
                  <span>Empresa: {offer.companyName}</span>
                  <span>Fotos: {imageCount}</span>
                  {offer.partnerAddressLine ? (
                    <span>
                      Distância:{" "}
                      {distanceLoading
                        ? "calculando..."
                        : distanceKm !== null
                          ? `~${distanceKm.toFixed(1)} km`
                          : "não disponível"}
                    </span>
                  ) : null}
                </div>
                {offer.partnerAddressLine && companyCoordinates && mapEmbedUrl ? (
                  <div className="card !grid !gap-2 !rounded-xl !p-2">
                    <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>
                      Localização da empresa parceira
                    </p>
                    <iframe
                      title={`Mapa de localização de ${offer.companyName}`}
                      src={mapEmbedUrl}
                      style={{ width: "100%", height: 180, border: "1px solid var(--line)", borderRadius: 10 }}
                      loading="lazy"
                    />
                  </div>
                ) : null}
                {offer.partnerAddressLine && mapLoading ? (
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Carregando mapa...</p>
                ) : null}
                <div className="card !grid !gap-1.5 !rounded-xl !p-3">
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>Perfil do parceiro</p>
                  <div className="flex items-center gap-2">
                    {offer.partnerLogoImage ? (
                      <Image
                        alt={`Logo de ${offer.companyName}`}
                        height={36}
                        src={offer.partnerLogoImage}
                        unoptimized
                        width={36}
                        style={{ width: 36, height: 36, borderRadius: 999, objectFit: "cover", border: "1px solid var(--line)" }}
                      />
                    ) : null}
                    <p style={{ margin: 0, fontWeight: 700 }}>{offer.companyName}</p>
                  </div>
                  {offer.partnerAddressLine ? <p style={{ margin: 0, fontSize: 13 }}>{offer.partnerAddressLine}</p> : null}
                  {socialLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {socialLinks.map((item) => (
                        <a
                          key={item.label}
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="badge badge-ok"
                          style={{ textDecoration: "none" }}
                        >
                          {item.label}: {item.value}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Redes não informadas.</p>
                  )}
                  <Link href={partnerProfileHref} className="btn btn-ghost !w-full text-center">
                    Ver perfil da empresa
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
                {modalAction}
              </div>
            </div>
          </article>
        </section>
      )}
    </>
  );
}
