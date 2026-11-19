import { PlanNotice } from "@/components/plan-notice";
import { FREE_AUDIT_LOG_LIMIT, FREE_NOTE_AUDIT_LOG_LIMIT } from "@/config/const/limits.const";
import { links } from "@/config/routing/links.route";
import type { AuditPlanNoticeProps } from "@/config/types/activity.types";

export function AuditPlanNotice({ scope }: AuditPlanNoticeProps) {
  const description = scope === "note"
    ? `Показаны последние ${FREE_NOTE_AUDIT_LOG_LIMIT} действия. На тарифах Amber и Diamond доступно больше записей.`
    : `Доступны до ${FREE_AUDIT_LOG_LIMIT} последних событий. Amber и Diamond добавляют поиск, фильтры и расширенную историю.`;

  return (
    <PlanNotice
      title="Больше событий с Notter Gem"
      description={description}
      href={links.NOTTER_GEM}
      openInNewTab
    />
  );
}
