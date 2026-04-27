"use client";

import { ChartColumnBig, ListChecks, Tag, UserCog } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Sidebar, SidebarBody, SidebarItemButton } from "@/components/ui/sidebar";

export type ConsumerSection = "overview" | "history" | "offers" | "profile";

export function ConsumerDashboardSidebar({
  sidebarOpen,
  setSidebarOpen,
  section,
  onSectionChange,
  consumerName,
  onLogout,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  section: ConsumerSection;
  onSectionChange: (section: ConsumerSection) => void;
  consumerName: string;
  onLogout: () => void;
}) {
  const initial = (consumerName.trim()[0] ?? "C").toUpperCase();

  return (
    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
      <SidebarBody className="justify-between gap-6 rounded-xl md:sticky md:top-6">
        <div className="flex flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto">
          <BrandLogo small />
          <div className="flex items-center gap-2">
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
              {initial}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Consumidor</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{consumerName}</p>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-1.5">
            <SidebarItemButton
              active={section === "overview"}
              label="Visão geral"
              icon={<ChartColumnBig size={16} />}
              onClick={() => onSectionChange("overview")}
            />
            <SidebarItemButton
              active={section === "history"}
              label="Meus códigos"
              icon={<ListChecks size={16} />}
              onClick={() => onSectionChange("history")}
            />
            <SidebarItemButton
              active={section === "offers"}
              label="Ofertas disponíveis"
              icon={<Tag size={16} />}
              onClick={() => onSectionChange("offers")}
            />
            <SidebarItemButton
              active={section === "profile"}
              label="Meu perfil"
              icon={<UserCog size={16} />}
              onClick={() => onSectionChange("profile")}
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
