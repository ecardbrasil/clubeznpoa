"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, List } from "lucide-react";
import { PartnerOfferCreator } from "@/components/partner/partner-offer-creator";
import type { Offer } from "@/lib/types";
import { getOfferStatusLabel } from "@/lib/partner/utils";

interface PartnerOffersPageProps {
  companyId: string;
  companyOffers: Offer[];
  availableNeighborhoods: string[];
  availableOfferCategories: string[];
  defaultCategories: string[];
  isPublishing: boolean;
  onSubmit: (payload: {
    title: string;
    description: string;
    discountLabel: string;
    category: string;
    neighborhood: string;
    images: string[];
  }) => Promise<string | null>;
}

type OffersTab = "create" | "list";

const tabs: { key: OffersTab; label: string; icon: typeof PlusCircle }[] = [
  { key: "create", label: "Nova Oferta", icon: PlusCircle },
  { key: "list", label: "Minhas Ofertas", icon: List },
];

export function PartnerOffersPage({
  companyId,
  companyOffers,
  availableNeighborhoods,
  availableOfferCategories,
  defaultCategories,
  isPublishing,
  onSubmit,
}: PartnerOffersPageProps) {
  const [activeTab, setActiveTab] = useState<OffersTab>("create");

  return (
    <div className="grid gap-4">
      {/* Cabeçalho */}
      <div className="card grid gap-1">
        <h2 style={{ margin: 0, fontSize: 20, fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700, color: "#0f1a13" }}>
          Ofertas
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
          Gerencie suas ofertas cadastradas ou crie uma nova.
        </p>
      </div>

      {/* Sliding Tabs */}
      <div className="relative inline-flex items-center gap-1 p-1 rounded-xl bg-[#f0f5ef] border border-[#dce8de] self-start">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "text-white" : "text-[#0f1a13]/70 hover:text-[#0f1a13]"
              }`}
            >
              <Icon size={15} />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="offers-tab-indicator"
                  className="absolute inset-0 rounded-lg bg-[#0f1a13] -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Painéis */}
      {activeTab === "create" && (
        <motion.div
          key="create"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <PartnerOfferCreator
            companyId={companyId}
            availableNeighborhoods={availableNeighborhoods}
            availableOfferCategories={availableOfferCategories}
            defaultCategories={defaultCategories}
            isPublishing={isPublishing}
            onSubmit={onSubmit}
          />
        </motion.div>
      )}

      {activeTab === "list" && (
        <motion.div
          key="list"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <section className="card grid gap-2">
            <div className="flex items-center justify-between">
              <h2 style={{ margin: 0, fontSize: 18, fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700, color: "#0f1a13" }}>
                Minhas Ofertas
              </h2>
              <span className="badge badge-ok">{companyOffers.length} oferta(s)</span>
            </div>

            {companyOffers.length === 0 && (
              <p style={{ margin: 0, padding: "24px 0", textAlign: "center", color: "var(--muted)" }}>
                Nenhuma oferta cadastrada ainda.
              </p>
            )}

            {companyOffers.map((offer) => (
              <div
                key={offer.id}
                className="grid gap-2 border-t pt-3"
                style={{ borderColor: "var(--line)" }}
              >
                {offer.images[0] && (
                  <img
                    alt={`Capa da oferta ${offer.title}`}
                    src={offer.images[0]}
                    style={{
                      width: "100%",
                      height: 128,
                      objectFit: "cover",
                      borderRadius: 10,
                    }}
                  />
                )}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="grid gap-0.5">
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>
                      {offer.title}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      {offer.discountLabel} • {offer.neighborhood}
                    </p>
                  </div>
                  <span className={`badge ${getOfferStatusLabel(offer) === "Ativa" ? "badge-ok" : "badge-pending"}`}>
                    {getOfferStatusLabel(offer)}
                  </span>
                </div>
                {offer.images.length > 0 && (
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                    {offer.images.length} foto(s)
                  </p>
                )}
              </div>
            ))}
          </section>
        </motion.div>
      )}
    </div>
  );
}