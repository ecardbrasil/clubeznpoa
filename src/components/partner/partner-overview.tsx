"use client";

import { useMemo, useState } from "react";
import type { AppData, Company, Offer } from "@/lib/types";
import type { PartnerSection } from "@/components/partner/dashboard-sidebar";
import { MetricCard } from "@/components/partner/metric-card";
import { StatusLine } from "@/components/partner/status-line";
import { CheckCircle2, Circle, LayoutDashboard, PlusCircle, ShieldCheck, Ticket } from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  section: PartnerSection;
  actionLabel: string;
}

function OnboardingChecklist({
  steps,
  completed,
  total,
  onSectionChange,
}: {
  steps: OnboardingStep[];
  completed: number;
  total: number;
  onSectionChange: (s: PartnerSection) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="card grid gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700, color: "#0f1a13" }}>
            Checklist inicial
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            {expanded
              ? "Conclua estes passos para deixar o perfil pronto."
              : "Checklist minimizado. Abra para ver as etapas."}
          </p>
        </div>
        <span className={`badge ${completed === total ? "badge-ok" : "badge-pending"}`}>
          {completed}/{total} concluídos
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#dce8de] bg-[#f8fcf8] px-3 py-2">
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
          {completed === total
            ? "Todas as etapas concluídas."
            : `${total - completed} etapa(s) pendente(s).`}
        </p>
        <button
          className="btn btn-ghost !w-auto !px-3 !py-1.5"
          onClick={() => setExpanded((c) => !c)}
          type="button"
        >
          {expanded ? "Minimizar" : "Abrir checklist"}
        </button>
      </div>

      {/* Barra de progresso */}
      <div style={{ width: "100%", height: 6, borderRadius: 999, background: "#e8ece4", overflow: "hidden" }}>
        <div
          style={{
            width: `${(completed / total) * 100}%`,
            height: "100%",
            borderRadius: 999,
            background: "linear-gradient(90deg, #c9f549 0%, #a8d63a 100%)",
            transition: "width 0.5s ease",
          }}
        />
      </div>

      {expanded && steps.map((step, index) => (
        <article key={step.id} className="grid gap-2 border-t pt-2" style={{ borderColor: "var(--line)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {step.done ? (
                <CheckCircle2 size={18} className="text-green-600" />
              ) : (
                <Circle size={18} className="text-[var(--muted)]" />
              )}
              <p style={{ margin: 0, fontWeight: 700 }}>
                {index + 1}. {step.title}
              </p>
            </div>
            <span className={`badge ${step.done ? "badge-ok" : "badge-pending"}`}>
              {step.done ? "Concluído" : "Pendente"}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>{step.description}</p>
          <button
            className="btn btn-ghost !w-auto !px-3 !py-1.5"
            onClick={() => onSectionChange(step.section)}
            type="button"
          >
            {step.done ? "Revisar etapa" : step.actionLabel}
          </button>
        </article>
      ))}
    </section>
  );
}

interface DashboardData {
  offersTotal: number;
  redemptionsToday: number;
  redemptionsWeek: number;
  statusCount: { generated: number; used: number; expired: number };
  topOfferPerformance: Array<{
    offer?: Offer;
    generated: number;
    used: number;
    conversion: number;
  }>;
  recentActivity: Array<{
    id: string;
    createdAt: string;
    label: string;
    detail: string;
  }>;
}

export function PartnerOverview({
  section,
  onSectionChange,
  companyOffers,
  dashboard,
  onboardingSteps,
  onboardingCompleted,
}: {
  section: string;
  onSectionChange: (s: PartnerSection) => void;
  companyOffers: Offer[];
  dashboard: DashboardData;
  onboardingSteps: OnboardingStep[];
  onboardingCompleted: number;
}) {
  return (
    <>
      <OnboardingChecklist
        steps={onboardingSteps}
        completed={onboardingCompleted}
        total={onboardingSteps.length}
        onSectionChange={onSectionChange}
      />

      <section className="card grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700, color: "#0f1a13" }}>
              Ações rápidas
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              A validação de código está disponível aqui para uso frequente.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-ghost !w-auto" onClick={() => onSectionChange("offer")} type="button">
              <PlusCircle size={14} />
              Cadastrar oferta
            </button>
            <button className="btn btn-primary !w-auto" onClick={() => onSectionChange("validate")} type="button">
              <ShieldCheck size={14} />
              Validar código
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Ofertas totais"
          value={dashboard.offersTotal}
          helper="Cadastradas pela empresa"
          icon={LayoutDashboard}
        />
        <MetricCard
          label="Resgates hoje"
          value={dashboard.redemptionsToday}
          helper="Gerados no dia atual"
          icon={Ticket}
        />
        <MetricCard
          label="Resgates 7 dias"
          value={dashboard.redemptionsWeek}
          helper="Janela móvel semanal"
          icon={Ticket}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card grid gap-2">
          <h2 style={{ margin: 0, fontSize: 18, fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700, color: "#0f1a13" }}>
            Painel operacional
          </h2>
          <StatusLine label="Códigos gerados" value={dashboard.statusCount.generated} tone="pending" />
          <StatusLine label="Códigos usados" value={dashboard.statusCount.used} tone="ok" />
          <StatusLine label="Códigos expirados" value={dashboard.statusCount.expired} tone="danger" />
        </section>

        <section className="card grid gap-2">
          <h2 style={{ margin: 0, fontSize: 18, fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700, color: "#0f1a13" }}>
            Performance por oferta
          </h2>
          {dashboard.topOfferPerformance.map((item) => (
            <div key={item.offer?.id} className="border-t pt-2" style={{ borderColor: "var(--line)" }}>
              <p style={{ margin: 0, fontWeight: 700 }}>{item.offer?.title}</p>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                {item.used} uso(s) • {item.generated} código(s) • {item.conversion}% conversão
              </p>
            </div>
          ))}
          {dashboard.topOfferPerformance.length === 0 && (
            <p style={{ margin: 0 }}>Sem dados de performance ainda.</p>
          )}
        </section>
      </div>
    </>
  );
}