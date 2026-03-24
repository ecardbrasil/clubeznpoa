"use client";

import { Building2, LayoutDashboard, LogOut, Ticket } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Sidebar, SidebarBody, SidebarItemButton } from "@/components/ui/sidebar";

export type AdminSection = "dashboard" | "companies" | "offers";

export function AdminDashboardSidebar({
  sidebarOpen,
  setSidebarOpen,
  section,
  onSectionChange,
  pendingCompanies,
  pendingOffers,
  onLogout,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  section: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  pendingCompanies: number;
  pendingOffers: number;
  onLogout: () => void;
}) {
  return (
    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
      <SidebarBody className="justify-between gap-6 rounded-xl md:sticky md:top-6">
        <div className="flex flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto">
          <BrandLogo small />
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Administrador</p>
            <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700 }}>Painel ClubeZN</p>
          </div>

          <div className="mt-2 flex flex-col gap-1.5">
            <SidebarItemButton
              active={section === "dashboard"}
              label="Dashboard"
              icon={<LayoutDashboard size={16} />}
              onClick={() => onSectionChange("dashboard")}
            />
            <SidebarItemButton
              active={section === "companies"}
              label="Empresas"
              icon={<Building2 size={16} />}
              onClick={() => onSectionChange("companies")}
            />
            <SidebarItemButton
              active={section === "offers"}
              label="Ofertas"
              icon={<Ticket size={16} />}
              onClick={() => onSectionChange("offers")}
            />
          </div>

          <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--muted)" }}>
            {pendingCompanies} empresa(s) e {pendingOffers} oferta(s) pendentes.
          </p>
        </div>

        <button className="btn btn-ghost" onClick={onLogout}>
          <LogOut size={16} />
          Sair
        </button>
      </SidebarBody>
    </Sidebar>
  );
}
