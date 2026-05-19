import { useEffect, useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { getById as getUserById } from "../../api/users/user";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, FileJson, Loader2, Menu, Trash, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/modal/confirm-modal";
import { pages } from "@/config/routing/pages.route";
import type { ModeratorPanelDocumentProps as DocumentProps } from "@/config/types/public.types";
import type { User } from "@/config/types/api.types";
import { formatLastEditTime, getCurrentEditTime } from "@/lib/last-edit-time";

export function ModeratorPanel({
  _id,
  userId,
  title,
  shortId,
  isShort,
  isPublished,
  isAcrhived,
  creatorName,
  lastEditor,
  lastEditTime,
  verifed,
  content
}: DocumentProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const { user: clerkUser } = useUser();
  const [clerkUserData, setClerkUserData] = useState<User | null>(null);
  const remove = useMutation(api.document.remove);
  const update = useMutation(api.document.update);
  const router = useRouter();

  const [localShortId, setLocalShortId] = useState(shortId || "");
  const [localIsShort, setLocalIsShort] = useState(!!isShort);
  const [localIsPublished, setLocalIsPublished] = useState(isPublished);
  const [localIsArchived, setLocalIsArchived] = useState(!!isAcrhived);
  const [localVerified, setLocalVerified] = useState(!!verifed);
  const [pendingSwitch, setPendingSwitch] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!clerkUser?.id) return;
      try {
        const data = await getUserById(clerkUser.id);
        setClerkUserData(data);
      } catch (error) {

      }
    };
    fetchUserData();
  }, [clerkUser?.id]);

  if (clerkUserData?.moderator !== true) return null;

  const confirmToggle = () => {
    if (typeof window === "undefined") return false;
    return window.confirm("Точно изменить это значение?");
  };

  const renderSwitchControl = (
    field: string,
    checked: boolean,
    onCheckedChange: (value: boolean) => void,
  ) => {
    if (pendingSwitch === field) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    return <Switch checked={checked} onCheckedChange={onCheckedChange} />;
  };

  const handleUpdate = async (field: string, value: any, actionDescription: string) => {
    try {
      await update({
        id: _id,
        userId,
        [field]: value,
        lastEditTime: getCurrentEditTime(),
      });
      toast.success("Обновлено успешно");
      return true;
    } catch (err: any) {
      const errorMessage = err.message || "Ошибка при обновлении";
      toast.error(errorMessage);
      return false;
    }
  };

  const handleShortIdBlur = async () => {
    if (localShortId === (shortId || "")) {
      return;
    }

    const regex = /^[a-z0-9-]{4,30}$/;
    if (!regex.test(localShortId)) {
      const errorMessage = "Short ID должен быть 4–30 символов, только a-z, 0-9 и -";
      toast.error(errorMessage);
      setLocalShortId(shortId || "");
      return;
    }

    const actionDescription = `Short ID изменен с "${shortId || "не установлен"}" на "${localShortId}"`;
    await handleUpdate("shortId", localShortId, actionDescription);
  };

  const handleSwitchChange = async (field: string, value: boolean) => {
    if (!confirmToggle()) return;

    const fieldNames: { [key: string]: string } = {
      isShort: "короткая ссылка",
      isPublished: "публикация",
      isAcrhived: "архивация",
      verifed: "верификация",
    };

    const actionDescription = `${fieldNames[field]} ${value ? "включена" : "выключена"}`;

    try {
      setPendingSwitch(field);

      const isUpdated = await handleUpdate(field, value, actionDescription);
      if (!isUpdated) return;

      if (field === "isShort") setLocalIsShort(value);
      if (field === "isPublished") setLocalIsPublished(value);
      if (field === "isAcrhived") setLocalIsArchived(value);
      if (field === "verifed") setLocalVerified(value);
    } finally {
      setPendingSwitch(null);
    }
  };

  const onRemove = async (documentId: Id<"documents">) => {
    const promise = remove({
      id: documentId,
      userId,
    });

    toast.promise(promise, {
      loading: "Удаляем заметку...",
      success: "Заметка удалена!",
      error: "Не удалось удалить",
    });

    try {
      await promise;
      router.push(pages.DASHBOARD());
    } catch (error: any) {
    }
  };

  const downloadJson = () => {
    if (content && typeof window !== "undefined") {
      try {
        const parsedJson = JSON.parse(content);
        const jsonContent = JSON.stringify(parsedJson, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${title}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        toast.error("Ошибка при создании JSON файла");
      }
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setDialogOpen(true)} variant={"outline"} size={"icon"} className="h-8 w-8 rounded-lg border-border/70 bg-background/70 hover:bg-background">
          <Menu />
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-2xl border-white/40 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95">
        <DialogTitle className="text-lg font-semibold">Панель Модератора</DialogTitle>
        <DialogDescription>
          <p className="text-xs">_id: {_id}</p>
          <p>User ID: {userId}</p>
          <p>Short ID: {shortId}</p>
          <p className="flex flex-row items-center gap-1">
            Is short: {isShort ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </p>
          <p className="flex flex-row items-center gap-1">
            Is published: {isPublished ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </p>
          <p className="flex flex-row items-center gap-1">
            Is archived: {isAcrhived ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </p>
          <p>Creator: {creatorName}</p>
          <p>Last editor: {lastEditor}</p>
          <p>Last edit time: {formatLastEditTime(lastEditTime)}</p>

          <hr className="my-3 border-black/10 dark:border-white/10" />

          <div className="flex items-center gap-3">
            <p className="whitespace-nowrap">Short ID:</p>
            <Input
              value={localShortId}
              onChange={(e) => setLocalShortId(e.target.value)}
              onBlur={handleShortIdBlur}
              className="h-8 my-2"
            />
          </div>

          <div className="flex items-center gap-3">
            <p>IsShort:</p>
            {renderSwitchControl("isShort", localIsShort, (value) => handleSwitchChange("isShort", value))}
          </div>

          <div className="flex items-center gap-3">
            <p>IsPublished:</p>
            {renderSwitchControl("isPublished", localIsPublished, (value) => handleSwitchChange("isPublished", value))}
          </div>

          <div className="flex items-center gap-3">
            <p>IsArchived:</p>
            {renderSwitchControl("isAcrhived", localIsArchived, (value) => handleSwitchChange("isAcrhived", value))}
          </div>

          <div className="flex items-center gap-3">
            <p>Verifed:</p>
            {renderSwitchControl("verifed", localVerified, (value) => handleSwitchChange("verifed", value))}
          </div>

          <div className="flex flex-row items-center gap-2">
            <ConfirmModal onConfirm={() => onRemove(_id)}>
                <Button variant={"outline"} className="mt-4 rounded-lg">
                Удалить <Trash className="h-4 w-4 text-muted-foreground" />
                </Button>
            </ConfirmModal>

            <Button variant={"outline"} className="mt-4 rounded-lg" onClick={downloadJson}>
                <FileJson className="h-4 w-4" /> Скачать JSON
            </Button>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
