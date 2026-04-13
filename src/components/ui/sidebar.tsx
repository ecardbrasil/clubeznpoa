"use client";

import { cn } from "@/lib/utils";
import React, { createContext, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return <SidebarContext.Provider value={{ open, setOpen, animate }}>{children}</SidebarContext.Provider>;
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

type SidebarBodyProps = Omit<React.ComponentProps<typeof motion.div>, "children"> & {
  children: React.ReactNode;
};

export const SidebarBody = ({ children, ...props }: SidebarBodyProps) => {
  return (
    <>
      <DesktopSidebar {...props}>{children}</DesktopSidebar>
      <MobileSidebar {...(props as React.ComponentProps<"div">)}>{children}</MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof motion.div>, "children"> & { children: React.ReactNode }) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "relative hidden h-full flex-col border border-[var(--line)] bg-white px-3 py-3 shadow-[var(--shadow-soft)] md:flex md:flex-shrink-0",
        className,
      )}
      animate={{
        width: animate ? (open ? "250px" : "66px") : "250px",
      }}
      {...props}
    >
      <button
        type="button"
        className="absolute right-2 top-2 z-10 hidden h-8 w-8 items-center justify-center rounded-md border border-[var(--line)] bg-white text-[var(--brand)] md:inline-flex"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Minimizar menu lateral" : "Expandir menu lateral"}
        title={open ? "Minimizar" : "Expandir"}
      >
        {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "flex w-full items-center justify-between rounded-xl border border-[var(--line)] bg-white px-3 py-2 shadow-[var(--shadow-soft)] md:hidden",
          className,
        )}
        {...props}
      >
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line)]"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menu lateral"
        >
          <Menu size={18} />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex h-full w-full flex-col bg-white p-4"
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line)]"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu lateral"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const SidebarItemButton = ({
  label,
  icon,
  active,
  onClick,
  className,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  className?: string;
}) => {
  const { open, animate } = useSidebar();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/sidebar flex w-full items-center justify-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition",
        active ? "bg-[#C9F549] text-[#13210f]" : "text-[var(--brand)] hover:bg-[#f8fbf4]",
        className,
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="whitespace-pre"
      >
        {label}
      </motion.span>
    </button>
  );
};
