import Link from "next/link";
import { ArrowUpRight, Gem } from "lucide-react";
import type { PlanNoticeProps } from "@/config/types/components.types";

export function PlanNotice({ title, description, href, openInNewTab }: PlanNoticeProps) {
  return (
    <aside className="@container rounded-xl bg-muted/50 p-2.5">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1.5 @sm:grid-cols-[auto_minmax(0,1fr)_auto] @sm:gap-x-3">
        <span className="flex size-6 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 @sm:row-span-2 @sm:size-9 @sm:rounded-lg dark:text-amber-300">
          <Gem className="size-3.5 @sm:size-4" aria-hidden="true" />
        </span>
        <p className="text-sm font-medium leading-snug">{title}</p>
        <p className="col-span-2 text-xs leading-relaxed text-muted-foreground @sm:col-span-1 @sm:col-start-2">
          {description}
        </p>
        <Link
          href={href}
          target={openInNewTab ? "_blank" : undefined}
          rel={openInNewTab ? "noopener noreferrer" : undefined}
          className="text-link col-span-2 inline-flex min-h-8 max-w-full items-center gap-1.5 justify-self-start rounded-lg bg-background px-2 text-xs font-medium text-foreground shadow-xs focus-visible:ring-2 focus-visible:ring-ring @sm:col-span-1 @sm:col-start-3 @sm:row-span-2 @sm:row-start-1"
        >
          Посмотреть тарифы
          <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
