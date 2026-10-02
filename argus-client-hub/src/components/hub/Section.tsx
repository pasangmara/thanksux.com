import { cn } from "@/components/ui/cn";

export function Card({ className, children, id }: { className?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className={cn("card min-w-0 p-5 sm:p-6", className)}>
      {children}
    </section>
  );
}

export function CardTitle({ children, aside, icon }: { children: React.ReactNode; aside?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {icon}
      <h2 className="flex-1 font-display text-[19px] font-medium text-text">{children}</h2>
      {aside}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-mint-soft text-mint">{icon}</span>
      <p className="font-display text-[18px] font-medium text-text">{title}</p>
      <p className="max-w-sm text-[14px] text-muted">{body}</p>
      {action}
    </div>
  );
}
