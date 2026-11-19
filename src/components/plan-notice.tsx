import Link from "next/link";
import { ArrowUpRight, Gem } from "lucide-react";
import type { PlanNoticeProps } from "@/config/types/components.types";

export function PlanNotice({ title, description, href, openInNewTab }: PlanNoticeProps) {
  return (
    <aside className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/50 p-3">
      <div className="flex min-w-0 flex-[1_1_15rem] items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
          <Gem className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <Link
        href={href}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        className="text-link ml-auto inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-background px-2.5 text-xs font-medium text-foreground shadow-xs focus-visible:ring-2 focus-visible:ring-ring"
      >
        Посмотреть тарифы
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </Link>
    </aside>
  );
}
