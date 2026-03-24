"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (title: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toneStyle: Record<ToastTone, { border: string; bg: string; text: string }> = {
  success: { border: "#8fd8bc", bg: "#ecfaf3", text: "#0f5c3f" },
  error: { border: "#efb2b2", bg: "#fff3f3", text: "#7c1f1f" },
  info: { border: "#b8d5f5", bg: "#eef6ff", text: "#1f4f84" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((title: string, tone: ToastTone = "info") => {
    const id = `t_${crypto.randomUUID()}`;
    setToasts((current) => [...current, { id, title, tone }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed right-3 top-3 z-[140] grid w-[min(92vw,360px)] gap-2"
      >
        {toasts.map((toast) => (
          <article
            key={toast.id}
            className="rounded-xl border px-3 py-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
            style={{
              borderColor: toneStyle[toast.tone].border,
              background: toneStyle[toast.tone].bg,
              color: toneStyle[toast.tone].text,
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{toast.title}</p>
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

