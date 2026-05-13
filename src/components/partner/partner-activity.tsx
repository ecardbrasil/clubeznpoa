"use client";

import { History } from "lucide-react";
import { formatDate } from "@/lib/partner/utils";

interface ActivityItem {
  id: string;
  createdAt: string;
  label: string;
  detail: string;
}

export function PartnerActivity({ activities }: { activities: ActivityItem[] }) {
  return (
    <section className="card grid gap-2">
      <div className="flex items-center gap-2">
        <History size={20} className="text-[var(--brand)]" />
        <h2 style={{ margin: 0, fontSize: 18, fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700, color: "#0f1a13" }}>
          Atividade recente
        </h2>
      </div>

      {activities.map((item) => (
        <div key={item.id} className="border-t pt-2" style={{ borderColor: "var(--line)" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>{item.label}</p>
          <p style={{ margin: 0, fontSize: 13 }}>{item.detail}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{formatDate(item.createdAt)}</p>
        </div>
      ))}
      {activities.length === 0 && <p style={{ margin: 0 }}>Sem atividade recente.</p>}
    </section>
  );
}