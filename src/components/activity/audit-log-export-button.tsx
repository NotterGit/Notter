"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/hint";
import { useAccountProfile } from "@/hooks/use-account-profile";
import { isDiamondPlan } from "@/config/const/limits.const";
import { API } from "@/config/routing/api.route";
import toast from "react-hot-toast";
import { Download } from "lucide-react";

interface AuditLogExportButtonProps {
  orgId: string;
}

export function AuditLogExportButton({ orgId }: AuditLogExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isOrg = orgId.startsWith("org_");
  const { data: profile, isLoading: isProfileLoading } = useAccountProfile(
    orgId,
    isOrg
  );
  const hasDiamond = isDiamondPlan(profile?.premium);

  const handleExport = async () => {
    if (isProfileLoading || !hasDiamond) return;

    try {
      setIsLoading(true);
      const res = await fetch(API.AUDIT_LOGS.EXPORT(orgId));

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Не удалось выгрузить журнал аудита");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      link.download = `notter-audit-log-${orgId}-${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Журнал аудита успешно выгружен в CSV");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ошибка при экспорте журнала"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isLoading || isProfileLoading || !hasDiamond;

  const button = (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isDisabled}
      className="h-8 rounded-xl text-xs border-border/60 hover:bg-muted/60 transition-all font-medium disabled:opacity-50"
    >
      <Download className="h-3.5 w-3.5 mr-1.5" />
      {isLoading ? "Экспорт..." : "Экспорт в CSV"}
    </Button>
  );

  if (!hasDiamond && !isProfileLoading) {
    return (
      <Hint
        side="left"
        sideOffset={6}
        description="Экспорт доступен только на тарифе Diamond"
      >
        <span className="inline-block cursor-not-allowed">
          {button}
        </span>
      </Hint>
    );
  }

  return button;
}
