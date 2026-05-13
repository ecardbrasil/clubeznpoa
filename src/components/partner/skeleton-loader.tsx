"use client";

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[#e8ece4] ${className ?? ""}`}
      style={style}
    />
  );
}

export function PartnerDashboardSkeleton() {
  return (
    <div className="grid gap-4">
      {/* Onboarding skeleton */}
      <div className="card grid gap-2.5">
        <div className="flex items-center justify-between">
          <div className="grid gap-1">
            <Skeleton style={{ width: 180, height: 20 }} />
            <Skeleton style={{ width: 260, height: 14 }} />
          </div>
          <Skeleton style={{ width: 80, height: 28, borderRadius: 999 }} />
        </div>
        <Skeleton style={{ width: "100%", height: 44, borderRadius: 10 }} />
      </div>

      {/* Actions skeleton */}
      <div className="card grid gap-2">
        <Skeleton style={{ width: 200, height: 20 }} />
        <div className="flex gap-2">
          <Skeleton style={{ width: 140, height: 36, borderRadius: 999 }} />
          <Skeleton style={{ width: 140, height: 36, borderRadius: 999 }} />
        </div>
      </div>

      {/* Metric cards skeleton */}
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card grid gap-2">
            <div className="flex items-center justify-between">
              <Skeleton style={{ width: 100, height: 14 }} />
              <Skeleton style={{ width: 18, height: 18, borderRadius: 4 }} />
            </div>
            <Skeleton style={{ width: 60, height: 32 }} />
            <Skeleton style={{ width: 140, height: 12 }} />
          </div>
        ))}
      </div>

      {/* Panel skeleton */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card grid gap-2">
          <Skeleton style={{ width: 160, height: 20 }} />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between border-t pt-2" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center gap-2">
                <Skeleton style={{ width: 14, height: 14, borderRadius: 4 }} />
                <Skeleton style={{ width: 120, height: 14 }} />
              </div>
              <Skeleton style={{ width: 40, height: 24, borderRadius: 999 }} />
            </div>
          ))}
        </div>
        <div className="card grid gap-2">
          <Skeleton style={{ width: 160, height: 20 }} />
          {[1, 2].map((i) => (
            <div key={i} className="border-t pt-2" style={{ borderColor: "var(--line)" }}>
              <Skeleton style={{ width: 140, height: 16 }} />
              <Skeleton style={{ width: 200, height: 12, marginTop: 4 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}