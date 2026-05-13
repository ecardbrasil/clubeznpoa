"use client";

import { Bell } from "lucide-react";
import { formatDate } from "@/lib/partner/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function PartnerNotifications({
  notifications,
  userId,
  companyId,
  onMarkAsRead,
  onMarkAllAsRead,
}: {
  notifications: Notification[];
  userId: string;
  companyId: string;
  onMarkAsRead: (notificationId: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
}) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <section className="card grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-[var(--brand)]" />
          <h2 style={{ margin: 0, fontSize: 18, fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700, color: "#0f1a13" }}>
            Notificações de status
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${unread > 0 ? "badge-pending" : "badge-ok"}`}>
            {unread} não lida(s)
          </span>
          {unread > 0 && (
            <button
              className="btn btn-ghost !w-auto !px-3 !py-1.5"
              onClick={onMarkAllAsRead}
              type="button"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      {notifications.map((notification) => (
        <article
          key={notification.id}
          className="grid gap-1.5 border-t pt-2"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p style={{ margin: 0, fontWeight: 700 }}>{notification.title}</p>
            <span className={`badge ${notification.read ? "badge-ok" : "badge-pending"}`}>
              {notification.read ? "Lida" : "Nova"}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13 }}>{notification.message}</p>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>{formatDate(notification.createdAt)}</p>
          {!notification.read && (
            <button
              className="btn btn-ghost !w-auto !px-3 !py-1.5"
              onClick={() => onMarkAsRead(notification.id)}
              type="button"
            >
              Marcar como lida
            </button>
          )}
        </article>
      ))}

      {notifications.length === 0 && (
        <p style={{ margin: 0 }}>Sem notificações de status até o momento.</p>
      )}
    </section>
  );
}