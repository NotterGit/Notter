'use client';

import { useRouter } from "next/navigation";
import { useOrganization, useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Archive, FileJson, MoreHorizontal, Undo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Protect } from "@clerk/nextjs";
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
  const isOrg = organization?.id !== undefined
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

  const onArchive = () => {
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
      <DropdownMenuContent className="w-60 rounded-xl border-white/60 bg-white/95 shadow-xl dark:border-white/10 dark:bg-zinc-950/95" align="end" alignOffset={8} forceMount>
        <Protect
          condition={(check) => {
            return check({
              role: "org:admin",
            }) || doc?.userId === user?.id;
          }}
          fallback={<></>}
        >
          {!doc?.isAcrhived ? (
            <DropdownMenuItem onClick={onArchive}>
              <Archive className="h-4 w-4" />
              Архивировать
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={onRestore}>
              <Undo className="h-4 w-4" />
              Восстановить
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
        </Protect>
        
        {profile?.premium == 2 && (
          <>
            <DropdownMenuItem onClick={downloadJson}>
              <FileJson className="h-4 w-4" /> Скачать JSON
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setOpenModal(true)}>
              <FileJson className="h-4 w-4" /> Загрузить JSON
            </DropdownMenuItem>

            <DropdownMenuSeparator />
          </>
        )}

        <div className="p-1 text-xs text-muted-foreground">
          Заметка создана: {doc?.userName}
        </div>
        <div className="p-1 text-xs text-muted-foreground">
          Последнее изменение от: {doc?.lastEditor}
        </div>
        <div className="p-1 text-xs text-muted-foreground">
          Последние изменение в: {formatLastEditTime(doc?.lastEditTime)}
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
