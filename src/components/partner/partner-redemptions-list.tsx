"use client";

import { useState } from "react";
import { Ticket } from "lucide-react";
import type { Offer, Redemption } from "@/lib/types";
import { formatDate } from "@/lib/partner/utils";

type RedemptionFilter = "all" | "generated" | "used" | "expired";

export function PartnerRedemptionsList({
  companyOffers,
  redemptions,
}: {
  companyOffers: Offer[];
  redemptions: Redemption[];
}) {
  const [filter, setFilter] = useState<RedemptionFilter>("all");

  const filtered = redemptions.filter((item) =>
    filter === "all" ? true : item.status === filter,
  );

  return (
    <section className="card grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Ticket size={20} className="text-[var(--brand)]" />
          <h2 style={{ margin: 0, fontSize: 18, fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700, color: "#0f1a13" }}>
            Últimos resgates
          </h2>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as RedemptionFilter)}
          style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "8px 10px", background: "#fff" }}
        >
          <option value="all">Todos</option>
          <option value="generated">Gerados</option>
          <option value="used">Usados</option>
          <option value="expired">Expirados</option>
        </select>
      </div>

      {filtered.slice(0, 12).map((item) => {
        const offer = companyOffers.find((o) => o.id === item.offerId);
        return (
          <div key={item.id} className="border-t pt-2" style={{ borderColor: "var(--line)" }}>
            <p style={{ margin: 0, fontWeight: 700 }}>{offer?.title ?? "Oferta removida"}</p>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
              Código {item.code} • {item.status} • criado em {formatDate(item.createdAt)}
            </p>
          </div>
        );
      })}
      {filtered.length === 0 && <p style={{ margin: 0 }}>Nenhum resgate encontrado nesse filtro.</p>}
    </section>
  );
}