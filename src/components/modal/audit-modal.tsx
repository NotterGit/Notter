"use client";

import { useEffect, useState } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { useWorkspaceAdmin } from "@/components/hooks/use-workspace-admin";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { API } from "@/config/routing/api.route";
import { useAuditModal } from "@/components/hooks/use-audit-modal";
import { useAccountProfile } from "@/hooks/use-account-profile";
import { FREE_NOTE_AUDIT_LOG_LIMIT, hasExtendedAuditLog } from "@/config/const/limits.const";
import type { NoteAuditLog } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActivityItem } from "@/components/activity/activity-item";
import { ActivityView } from "@/components/activity/activity-view";
import { AuditLogExportButton } from "@/components/activity/audit-log-export-button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuditPlanNotice } from "@/components/activity/audit-plan-notice";

export function AuditModal() {
  const { isOpen, documentId, documentTitle, onClose } = useAuditModal();
  const { user } = useUser();
  const { organization } = useOrganization();
  const { isOrg } = useWorkspaceAdmin();
  const orgId = isOrg ? (organization?.id as string) : (user?.id as string);

  const [activeTab, setActiveTab] = useState<"note" | "workspace">("note");

  useEffect(() => {
    if (documentId) {
      setActiveTab("note");
    } else {
      setActiveTab("workspace");
    }
  }, [documentId, isOpen]);

  const { data: limits } = useQuery<{
    premiumLevel?: number;
  }>({
    queryKey: ["workspace-limits", orgId],
    enabled: Boolean(isOpen && orgId),
  });

  const { data: profile } = useAccountProfile(orgId, isOrg);

  const workspacePremium = Math.max(
    Number(profile?.premium ?? 0),
    Number(limits?.premiumLevel ?? 0)
  );

  const { data: wsData, isLoading: isWsLoading } = useQuery<{
    logs: NoteAuditLog[];
    isExtended: boolean;
  }>({
    queryKey: ["workspace-audit-logs", orgId, workspacePremium],
    queryFn: () =>
      fetcher(
        API.AUDIT_LOGS.GET({
          orgId,
          fallbackPremiumLevel: workspacePremium,
        })
      ),
    enabled: Boolean(isOpen && orgId && (activeTab === "workspace" || !documentId)),
  });

  const isExtended = wsData?.isExtended ?? hasExtendedAuditLog(workspacePremium);

  const { data: noteLogs, isLoading: isNoteLoading } = useQuery<NoteAuditLog[]>({
    queryKey: ["document-logs", documentId, orgId, workspacePremium],
    queryFn: () => fetcher(API.DOCUMENTS.LOGS(documentId!, orgId, workspacePremium)),
    enabled: Boolean(isOpen && documentId && orgId && activeTab === "note"),
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[85dvh] w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-3xl border-0 bg-white/95 p-4 shadow-2xl backdrop-blur-2xl dark:bg-zinc-950/95 sm:max-w-2xl sm:rounded-3xl sm:p-6">
        <DialogHeader className="space-y-3 text-left">
          <div className="flex flex-wrap items-start justify-between gap-2 pr-7">
            <div className="min-w-0">
              <DialogTitle>
                {activeTab === "note" && documentId ? "Журнал заметки" : "Журнал аудита"}
              </DialogTitle>
              <DialogDescription className={activeTab === "note" && documentTitle ? "mt-1 wrap-anywhere" : "sr-only"}>
                {activeTab === "note" && documentId
                  ? documentTitle || "История действий с заметкой"
                  : "История действий в пространстве"}
              </DialogDescription>
            </div>
            {activeTab === "workspace" && orgId && (
              <AuditLogExportButton orgId={orgId} fallbackPremiumLevel={workspacePremium} />
            )}
          </div>

          {documentId && (
            <div role="group" aria-label="Область журнала" className="flex flex-wrap gap-1.5">
              {(["note", "workspace"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  aria-pressed={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "min-h-10 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    activeTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  {tab === "note" ? "Заметка" : "Пространство"}
                </button>
              ))}
            </div>
          )}
        </DialogHeader>

        <div key={activeTab} className="min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {activeTab === "note" && documentId ? (
            <div className="space-y-3 pt-1">
              {isNoteLoading ? (
                <div className="space-y-2 py-2">
                  <Skeleton className="w-full h-14 rounded-xl" />
                  <Skeleton className="w-full h-14 rounded-xl" />
                  <Skeleton className="w-full h-14 rounded-xl" />
                </div>
              ) : !noteLogs || noteLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl bg-muted/10">
                  <FileText className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-semibold text-foreground">
                    Нет записей о действиях
                  </p>
                </div>
              ) : (
                <ol className="divide-y divide-border/40">
                  {noteLogs.map((log) => (
                    <ActivityItem
                      key={log.id}
                      data={log}
                    />
                  ))}
                </ol>
              )}

              {!isExtended && noteLogs && noteLogs.length >= FREE_NOTE_AUDIT_LOG_LIMIT && (
                <AuditPlanNotice scope="note" />
              )}
            </div>
          ) : (
            <div className="pt-1">
              {isWsLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="w-full h-14 rounded-xl" />
                    <Skeleton className="w-full h-14 rounded-xl" />
                    <Skeleton className="w-full h-14 rounded-xl" />
                  </div>
                </div>
              ) : (
                <ActivityView
                  initialLogs={wsData?.logs || []}
                  isExtendedAudit={wsData?.isExtended || false}
                />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
