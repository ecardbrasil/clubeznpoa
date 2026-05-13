"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react";

export type TrendType = "up" | "down" | "neutral";

export interface MetricCardProps {
  label: string;
  value: number;
  helper: string;
  icon?: LucideIcon;
  trendChange?: string;
  trendType?: TrendType;
  onClick?: () => void;
}

export function MetricCard({ label, value, helper, icon: Icon, trendChange, trendType, onClick }: MetricCardProps) {
  const TrendIcon = trendType === "up" ? ArrowUp : trendType === "down" ? ArrowDown : Minus;
  const trendColor =
    trendType === "up"
      ? "text-green-700"
      : trendType === "down"
        ? "text-red-600"
        : "text-[var(--muted)]";

  return (
    <motion.article
      className={`card grid gap-1 ${onClick ? "cursor-pointer" : "cursor-default"}`}
      whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)" }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>{label}</p>
        {Icon && <Icon size={18} className="text-[var(--muted)] opacity-60" />}
      </div>
      <p style={{ margin: 0, fontSize: 30, fontWeight: 800, fontFamily: "var(--font-poppins), sans-serif", color: "#0f1a13" }}>
        {value}
      </p>
      {trendChange && (
        <p className={`flex items-center gap-1 text-xs font-medium ${trendColor}`} style={{ margin: 0 }}>
          <TrendIcon size={12} />
          {trendChange}
        </p>
      )}
      <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{helper}</p>
    </motion.article>
  );
}