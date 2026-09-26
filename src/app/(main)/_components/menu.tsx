'use client';

import { useRouter } from "next/navigation";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useWorkspaceAdmin } from "@/components/hooks/use-workspace-admin";
import { useMutation, useQuery } from "convex/react";
import { toast } from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Archive, Calendar, Download, FolderInput, History, MoreHorizontal, Pin, PinOff, Undo, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { useEffect, useState } from "react";
import { useMoveNote } from "@/components/hooks/use-move-note";

import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/shadcn-io/dropzone";
import { getOrgById as getOrg } from "@/api/org";
import { getUserById as getUser } from "@/api/user";
import { pages } from "@/config/routing/pages.route";
import { formatLastEditTime, getCurrentEditTime } from "@/lib/last-edit-time";
import type { MenuProps } from "@/config/types/main.types";
import type { Org, User } from "@/config/types/api.types";

export function Menu({ documentId }: MenuProps) {
  const router = useRouter();
  const { user } = useUser();
  const { organization } = useOrganization();
  const { isOrg, isAdmin } = useWorkspaceAdmin();
  const orgId = isOrg ? organization?.id as string : user?.id as string;
  const archive = useMutation(api.document.archive);
  const restore = useMutation(api.document.restore);
  const update = useMutation(api.document.update);
  const doc = useQuery(api.document.getById, {
    documentId: documentId as Id<"documents">,
    userId: orgId,
  });

  const [openModal, setOpenModal] = useState(false);
  const [profile, setProfile] = useState<User | Org | null>(null)
  const moveNote = useMoveNote();

  const onMove = () => {
    if (!documentId) return;
    moveNote.onOpen(documentId);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (isOrg) {
        const orgData = await getOrg(orgId);
        setProfile(orgData);
      } else {
        const userData = await getUser(orgId);
        setProfile(userData);
      }
    };

    fetchProfile();
  }, [orgId, isOrg]);

  const onTogglePin = () => {
    if (!doc) return;

    const isCurrentlyPinned = Boolean(doc.isPinned);
    const promise = update({
      id: documentId,
      userId: orgId,
      isPinned: !isCurrentlyPinned,
      lastEditor: user?.username as string,
      lastEditTime: getCurrentEditTime(),
    });

    toast.promise(promise, {
      loading: isCurrentlyPinned ? "Открепляем заметку..." : "Закрепляем заметку...",
      success: isCurrentlyPinned ? "Заметка откреплена!" : "Заметка закреплена!",
      error: isCurrentlyPinned ? "Не удалось открепить заметку" : "Не удалось закрепить заметку",
    });
  };

  const onArchive = () => {
    if (isOrg && !isAdmin) {
      toast.error("Только администраторы могут архивировать заметки");
      return;
    }

    update({
      id: documentId,
      userId: orgId,
      isPublished: false,
      lastEditor: user?.username as string,
      lastEditTime: getCurrentEditTime()
    })

    const promise = archive({
      id: documentId,
      userId: orgId,
    });

    toast.promise(promise, {
      loading: "Перемещаем в архив...",
      success: "Заметка перемещена в архив!",
      error: "Не удалось переместить в архив",
    });

    router.push(pages.DASHBOARD());
  };

  const onRestore = () => {
    if (isOrg && !isAdmin) {
      toast.error("Только администраторы могут восстанавливать заметки");
      return;
    }

    update({
      id: documentId,
      userId: orgId,
      lastEditor: user?.username as string,
      lastEditTime: getCurrentEditTime()
    })

    const promise = restore({
      id: documentId,
      userId: orgId,
    });

    toast.promise(promise, {
      loading: "Восстанавливаем...",
      success: "Заметка восстановлена!",
      error: "Не удалось восстановить",
    });

    router.push(pages.DASHBOARD(documentId));
  };

  const downloadJson = () => {
    if (doc?.content && typeof window !== "undefined") {
      const parsedJson = JSON.parse(doc.content);
      const jsonContent = JSON.stringify(parsedJson, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doc?.title}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const uploadJson = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const rawContent = reader.result as string;
          try {
            const parsed = JSON.parse(rawContent);
            let contentToSave = rawContent;
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.content && !parsed.type) {
              contentToSave = typeof parsed.content === "string" ? parsed.content : JSON.stringify(parsed.content);
            }

            const promise = update({
              id: documentId,
              userId: orgId,
              content: contentToSave,
              lastEditor: user?.username as string,
              lastEditTime: getCurrentEditTime()
            });

            toast.promise(promise, {
              success: "Заметка обновлена!",
              error: "Не удалось обновить заметку",
              loading: "Обновляем заметку..."
            });

            promise.then(() => {
              window.location.reload();
            });
          } catch {
            toast.error("Неверный формат JSON файла");
          }
        } else {
          toast.error("Ошибка чтения файла");
        }
      };
      reader.onerror = () => {
        toast.error("Ошибка при чтении файла");
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-72 rounded-2xl border-white/60 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95"
          align="end"
          alignOffset={8}
          forceMount
        >
          <DropdownMenuItem
            onClick={onTogglePin}
            className="cursor-pointer rounded-xl px-2.5 py-2 text-xs font-medium gap-2.5 transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            {doc?.isPinned ? (
              <>
                <PinOff className="h-4 w-4 text-muted-foreground" />
                Открепить
              </>
            ) : (
              <>
                <Pin className="h-4 w-4 text-muted-foreground" />
                Закрепить
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            onClick={onMove}
            className="cursor-pointer rounded-xl px-2.5 py-2 text-xs font-medium gap-2.5 transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            <FolderInput className="h-4 w-4 text-muted-foreground" />
            Переместить
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />


          {isAdmin && (
            <>
              {!doc?.isAcrhived ? (
                <DropdownMenuItem
                  onClick={onArchive}
                  className="cursor-pointer rounded-xl px-2.5 py-2 text-xs font-medium gap-2.5 transition hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  Архивировать
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={onRestore}
                  className="cursor-pointer rounded-xl px-2.5 py-2 text-xs font-medium gap-2.5 transition hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Undo className="h-4 w-4 text-muted-foreground" />
                  Восстановить
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="my-1" />
            </>
          )}
          
          {profile?.premium == 2 && (
            <>
              <DropdownMenuItem
                onClick={downloadJson}
                className="cursor-pointer rounded-xl px-2.5 py-2 text-xs font-medium gap-2.5 transition hover:bg-black/5 dark:hover:bg-white/10"
              >
                <Download className="h-4 w-4 text-muted-foreground" /> Скачать JSON
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => setOpenModal(true)}
                className="cursor-pointer rounded-xl px-2.5 py-2 text-xs font-medium gap-2.5 transition hover:bg-black/5 dark:hover:bg-white/10"
              >
                <Upload className="h-4 w-4 text-muted-foreground" /> Загрузить JSON
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />
            </>
          )}

          <div className="rounded-xl border border-black/5 bg-black/[0.03] p-2.5 dark:border-white/5 dark:bg-white/[0.04] space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Calendar className="h-3.5 w-3.5" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Создана</span>
                  <span className="text-[10px] text-muted-foreground/70 font-mono">
                    {doc?._creationTime ? formatLastEditTime(doc._creationTime) : "—"}
                  </span>
                </div>
                <span className="truncate text-xs font-semibold text-foreground" title={doc?.userName || doc?.creatorName || "Пользователь"}>
                  {doc?.userName || doc?.creatorName || "Пользователь"}
                </span>
              </div>
            </div>

            <div className="h-px bg-black/[0.04] dark:bg-white/[0.06]" />

            <div className="flex items-start gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <History className="h-3.5 w-3.5" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Изменена</span>
                  <span className="text-[10px] text-muted-foreground/70 font-mono">
                    {doc?.lastEditTime ? formatLastEditTime(doc.lastEditTime) : "—"}
                  </span>
                </div>
                <span className="truncate text-xs font-semibold text-foreground" title={doc?.lastEditor || "—"}>
                  {doc?.lastEditor || "—"}
                </span>
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={openModal && profile?.premium == 2} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-black/10 bg-background/95 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Загрузить JSON файл</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Выберите или перетащите .json файл для обновления содержимого заметки
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            <Dropzone
              accept={{ "application/json": [".json"] }}
              maxFiles={1}
              onDrop={(acceptedFiles: File[]) => {
                uploadJson(acceptedFiles);
                setOpenModal(false);
              }}
              onError={(err) => {
                console.error(err);
                toast.error("Ошибка при выборе файла");
              }}
            >
              <DropzoneEmptyState />
              <DropzoneContent />
            </Dropzone>
          </div>

          <DialogFooter className="mt-4 sm:justify-end">
            <Button
              onClick={() => setOpenModal(false)}
              className="w-full sm:w-auto rounded-xl"
              variant="outline"
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

Menu.Skeleton = function MenuSkeleton() {
  return <Skeleton className="h-8 w-8" />;
};
