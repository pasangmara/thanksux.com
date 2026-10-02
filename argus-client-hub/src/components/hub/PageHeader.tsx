import { Pill } from "@/components/ui/Pill";
import { isDemoMode } from "@/lib/env";

export function PageHeader({
  title,
  subtitle,
  actions,
  before,
  after,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  before?: React.ReactNode;
  after?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4">
      {before}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[28px] leading-tight font-bold text-text sm:text-[32px]">{title}</h1>
            {after}
            {isDemoMode() && (
              <Pill tone="info" dot={false}>
                Sample data
              </Pill>
            )}
          </div>
          {subtitle && <p className="mt-1 text-[15px] text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
