"use client";

import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

type Tone = "ok" | "pending" | "danger";

const toneConfig: Record<Tone, { className: string; icon: typeof CheckCircle2 }> = {
  ok: { className: "badge badge-ok", icon: CheckCircle2 },
  pending: { className: "badge badge-pending", icon: Clock },
  danger: { className: "badge badge-danger", icon: AlertCircle },
};

export function StatusLine({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  const config = toneConfig[tone];
  const Icon = config.icon;

  return (
    <div
      className="flex items-center justify-between border-t py-2"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-[var(--muted)]" />
        <span style={{ fontSize: 14 }}>{label}</span>
      </div>
      <span className={`badge ${config.className}`}>{value}</span>
    </div>
  );
}