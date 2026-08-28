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
import { Archive, Calendar, Download, History, MoreHorizontal, Pin, PinOff, Undo, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { useEffect, useState } from "react";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/shadcn-io/dropzone";
import { getById as getOrg } from "../../api/orgs/org";
import { getById as getUser } from "../../api/users/user";
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
          const content = reader.result as string;
          const promise = update({
            id: documentId,
            userId: orgId,
            content: content,
            lastEditor: user?.username as string,
            lastEditTime: getCurrentEditTime()
          })
          toast.promise(promise, {
            success: "Заметка обновлена!",
            error: "Не удалось обновить заметку",
            loading: "Обновляем заметку..."
          })
          promise.then(() => {
            router.push(pages.DASHBOARD());
          });
        } else {
          toast.error("Ошибка чтения файла");
        }
      };
      reader.onerror = (err) => {
        toast.error("Ошибка при чтении файла");
      };
      reader.readAsText(file);
    }
  };

  return (
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
              onClick={() => setOpenModal(true)}
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
      {openModal && profile?.premium == 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-5 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Загрузите JSON файл</h3>
            <Dropzone
              accept={{ 'application/json': [] }}
              maxFiles={1}
              onDrop={(acceptedFiles: any) => {
                uploadJson(acceptedFiles);
                setOpenModal(false);
              }}
              onError={console.error}
            >
              <DropzoneEmptyState />
              <DropzoneContent />
            </Dropzone>
            <Button onClick={() => setOpenModal(false)} className="mt-4 w-full rounded-xl" variant={"outline"}>
              Закрыть
            </Button>
          </div>
        </div>
      )}
    </DropdownMenu>
  );
}

Menu.Skeleton = function MenuSkeleton() {
  return <Skeleton className="h-8 w-8" />;
};
