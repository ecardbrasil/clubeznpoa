"use client";

import Image from "next/image";
import { Bell, History, LayoutDashboard, PlusCircle, ShieldCheck, Ticket, UserCog, Users } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Sidebar, SidebarBody, SidebarItemButton } from "@/components/ui/sidebar";

export type PartnerSection = "overview" | "profile" | "validate" | "offer" | "redemptions" | "customers" | "notifications" | "activity";

export function PartnerDashboardSidebar({
  sidebarOpen,
  setSidebarOpen,
  section,
  onSectionChange,
  companyName,
  logoImage,
  onLogout,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  section: PartnerSection;
  onSectionChange: (section: PartnerSection) => void;
  companyName: string;
  logoImage?: string;
  onLogout: () => void;
}) {
  const companyInitial = (companyName.trim()[0] ?? "P").toUpperCase();

  return (
    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
      <SidebarBody className="justify-between gap-6 rounded-xl md:sticky md:top-6">
        <div className="flex flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto">
          <BrandLogo small />
          <div className="flex items-center gap-2">
            {logoImage ? (
              <Image
                src={logoImage}
                alt="Logo da empresa"
                width={44}
                height={44}
                unoptimized
                style={{ width: 44, height: 44, borderRadius: 999, objectFit: "cover", border: "1px solid var(--line)" }}
              />
            ) : (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  border: "1px solid var(--line)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  color: "var(--muted)",
                }}
              >
                {companyInitial}
              </div>
            )}
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Parceiro</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{companyName}</p>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-1.5">
            <SidebarItemButton
              active={section === "overview"}
              label="Visão geral"
              icon={<LayoutDashboard size={16} />}
              onClick={() => onSectionChange("overview")}
            />
            <SidebarItemButton
              active={section === "profile"}
              label="Perfil público"
              icon={<UserCog size={16} />}
              onClick={() => onSectionChange("profile")}
            />
            <SidebarItemButton
              active={section === "validate"}
              label="Validar código"
              icon={<ShieldCheck size={16} />}
              onClick={() => onSectionChange("validate")}
            />
            <SidebarItemButton
              active={section === "offer"}
              label="Nova oferta"
              icon={<PlusCircle size={16} />}
              onClick={() => onSectionChange("offer")}
            />
            <SidebarItemButton
              active={section === "redemptions"}
              label="Resgates"
              icon={<Ticket size={16} />}
              onClick={() => onSectionChange("redemptions")}
            />
            <SidebarItemButton
              active={section === "customers"}
              label="Clientes"
              icon={<Users size={16} />}
              onClick={() => onSectionChange("customers")}
            />
            <SidebarItemButton
              active={section === "notifications"}
              label="Notificações"
              icon={<Bell size={16} />}
              onClick={() => onSectionChange("notifications")}
            />
            <SidebarItemButton
              active={section === "activity"}
              label="Atividade"
              icon={<History size={16} />}
              onClick={() => onSectionChange("activity")}
            />
          </div>
        </div>

        <button className="btn btn-ghost" onClick={onLogout}>
          Sair
        </button>
      </SidebarBody>
    </Sidebar>
  );
}
