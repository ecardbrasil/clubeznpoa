"use client";

import { Users } from "lucide-react";
import { formatDate } from "@/lib/partner/utils";

interface CustomerInsight {
  userId: string;
  name: string;
  email: string;
  phone: string;
  generated: number;
  used: number;
  expired: number;
  lastCreatedAt: string;
  lastCode: string;
  offers: string[];
}

export function PartnerCustomersList({ customers }: { customers: CustomerInsight[] }) {
  return (
    <section className="card grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-[var(--brand)]" />
          <h2 style={{ margin: 0, fontSize: 18, fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700, color: "#0f1a13" }}>
            Clientes que geraram código
          </h2>
        </div>
        <span className="badge badge-ok">{customers.length} cliente(s)</span>
      </div>

      {customers.map((customer) => (
        <article
          key={customer.userId}
          className="grid gap-1.5 border-t pt-2"
          style={{ borderColor: "var(--line)" }}
        >
          <p style={{ margin: 0, fontWeight: 700 }}>{customer.name}</p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            {customer.email || "Sem e-mail"} • {customer.phone || "Sem telefone"}
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>
            Códigos: {customer.generated} gerado(s) • {customer.used} usado(s) • {customer.expired} expirado(s)
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
            Último código: {customer.lastCode} • {formatDate(customer.lastCreatedAt)}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
            Ofertas: {customer.offers.join(" • ") || "Sem oferta vinculada"}
          </p>
        </article>
      ))}

      {customers.length === 0 && (
        <p style={{ margin: 0 }}>
          Nenhum cliente gerou código para as ofertas da sua empresa até agora.
        </p>
      )}
    </section>
  );
}