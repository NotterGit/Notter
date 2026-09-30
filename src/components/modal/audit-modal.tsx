"use client";

import { useEffect, useState } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { useWorkspaceAdmin } from "@/components/hooks/use-workspace-admin";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { API } from "@/config/routing/api.route";
import { useAuditModal } from "@/components/hooks/use-audit-modal";
import { useAccountProfile } from "@/hooks/use-account-profile";
import { hasExtendedAuditLog } from "@/config/const/limits.const";
import { links } from "@/config/routing/links.route";
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
import { Activity, FileText, Gem, LayoutGrid, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

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

  const { data: profile } = useAccountProfile(orgId, isOrg);
  const isExtended = hasExtendedAuditLog(profile?.premium);

  // Fetch single note logs if documentId is present
  const { data: noteLogs, isLoading: isNoteLoading } = useQuery<NoteAuditLog[]>({
    queryKey: ["document-logs", documentId, orgId],
    queryFn: () => fetcher(API.DOCUMENTS.LOGS(documentId!, orgId)),
    enabled: Boolean(isOpen && documentId && orgId && activeTab === "note"),
  });

  // Fetch workspace logs
  const { data: wsData, isLoading: isWsLoading } = useQuery<{
    logs: NoteAuditLog[];
    isExtended: boolean;
    tariffName: string;
    totalCount: number;
  }>({
    queryKey: ["workspace-audit-logs", orgId],
    queryFn: () => fetcher(API.AUDIT_LOGS.GET({ orgId })),
    enabled: Boolean(isOpen && orgId && (activeTab === "workspace" || !documentId)),
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-6 rounded-3xl border border-white/60 bg-white/95 dark:border-white/10 dark:bg-zinc-950/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {activeTab === "note" && documentId ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <Activity className="h-4 w-4" />
                )}
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold">
                  {activeTab === "note" && documentId
                    ? `Журнал заметки`
                    : "Журнал аудита"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-md">
                  {activeTab === "note" && documentId
                    ? documentTitle
                      ? `История действий над «${documentTitle}»`
                      : "История действий над текущей заметкой"
                    : "История изменений и действий во всем пространстве"}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === "workspace" && orgId && (
                <AuditLogExportButton orgId={orgId} />
              )}
            </div>
          </div>

          {documentId && (
            <div className="flex items-center gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("note")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all border",
                  activeTab === "note"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/40"
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Эта заметка</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("workspace")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all border",
                  activeTab === "workspace"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/40"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Все пространство</span>
              </button>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {activeTab === "note" && documentId ? (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Действия с заметкой:{" "}
                  <strong className="text-foreground">
                    {noteLogs ? noteLogs.length : 0}
                  </strong>
                </span>

                {isExtended ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/20">
                    <Gem className="h-3 w-3" />
                    <span>Полная история</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg border border-border/40">
                    <span>Базовый журнал</span>
                  </span>
                )}
              </div>

              {isNoteLoading ? (
                <div className="space-y-2 py-2">
                  <Skeleton className="w-full h-14 rounded-xl" />
                  <Skeleton className="w-full h-14 rounded-xl" />
                  <Skeleton className="w-full h-14 rounded-xl" />
                </div>
              ) : !noteLogs || noteLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-border/60 bg-muted/10">
                  <FileText className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-semibold text-foreground">
                    Нет записей о действиях
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Действия над этой заметкой появятся здесь при её редактировании или перемещении
                  </p>
                </div>
              ) : (
                <ol className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {noteLogs.map((log) => (
                    <ActivityItem
                      key={log.id}
                      data={log}
                      extended={isExtended}
                    />
                  ))}
                </ol>
              )}

              {!isExtended && noteLogs && noteLogs.length >= 3 && (
                <div className="flex items-center justify-between gap-2 p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-xs text-muted-foreground">
                  <span>
                    Показаны последние 3 действия. Полная история доступна в тарифах{" "}
                    <span className="font-semibold text-amber-500 dark:text-yellow-400">Amber</span>
                    {" "}и{" "}
                    <span className="font-semibold text-cyan-500 dark:text-cyan-400">Diamond</span>.
                  </span>
                  <Link
                    href={links.NOTTER_GEM}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-yellow-400 hover:opacity-80 shrink-0"
                  >
                    <Gem className="h-3 w-3" />
                    <span>Подробнее</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="pt-1">
              {isWsLoading ? (
                <div className="space-y-3 py-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-32 rounded-xl" />
                    <Skeleton className="h-6 w-24 rounded-xl" />
                  </div>
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
                  tariffName={wsData?.tariffName}
                />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
