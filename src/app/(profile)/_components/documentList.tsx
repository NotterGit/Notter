import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, FileText, Pin } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import Twemoji from "react-twemoji";

import { updateOrg } from "@/api/org";
import { updateUser } from "@/api/user";
import { Skeleton } from "@/components/ui/skeleton";
import { API } from "@/config/routing/api.route";
import { pages } from "@/config/routing/pages.route";
import type { DocumentTreeItem } from "@/config/types/main.types";
import type { DocumentListProps } from "@/config/types/profile.types";
import { buildChildrenMap, flattenTree } from "@/lib/document-tree";
import { cn } from "@/lib/utils";
import { ProfileImage } from "./profile-image";
import VerifedBadge from "./verifed";

export function DocumentList({ user, setProfile }: DocumentListProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pinPending, setPinPending] = useState(false);
  const { user: clerkUser } = useUser();
  const isOrg = user._id.startsWith("org_");
  const canPin = Boolean(clerkUser && (clerkUser.id === user._id || clerkUser.id === user.owner));

  const { data: documents, isPending, isError, refetch } = useQuery<DocumentTreeItem[]>({
    queryKey: ["documents", "sidebar", user._id, "profile"],
    queryFn: async ({ signal }) => {
      const response = await fetch(API.DOCUMENTS.SIDEBAR({ userId: user._id, publicSorted: true }), { signal });
      if (!response.ok) throw new Error("Не удалось загрузить заметки");
      return response.json();
    },
  });

  const children = useMemo(() => {
    const published = (documents ?? []).filter((doc) => doc.isPublished && !doc.isPrivate);
    const visibleIds = new Set(published.map((doc) => doc._id));
    return buildChildrenMap(published.map((doc) => {
      const parent = doc.parentDocumentId ?? doc.parentDocument;
      return parent && visibleIds.has(parent)
        ? doc
        : { ...doc, parentDocumentId: null, parentDocument: null };
    }));
  }, [documents]);

  const visibleNotes = flattenTree("root", 0, children, expanded, null);

  const handlePinClick = async (docId: string) => {
    if (pinPending) return;
    const nextPin = docId === user.pined ? "" : docId;
    setPinPending(true);
    try {
      const updated = isOrg
        ? await updateOrg(user._id, { pined: nextPin })
        : await updateUser(user._id, { pined: nextPin });
      if (!updated) throw new Error("Не удалось изменить закрепление");
      setProfile((profile) => profile?._id === user._id ? { ...profile, pined: nextPin || null } : profile);
      toast.success(nextPin ? "Заметка закреплена" : "Заметка откреплена");
    } catch {
      toast.error("Не удалось изменить закрепление");
    } finally {
      setPinPending(false);
    }
  };

  if (isPending) {
    return (
      <div className="space-y-2" aria-label="Загрузка заметок" aria-busy="true">
        {[1, 2, 3].map((item) => <Skeleton key={item} className="h-14 w-full rounded-xl" />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <p>Не удалось загрузить заметки.</p>
        <button type="button" className="text-link text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => void refetch()}>
          Повторить
        </button>
      </div>
    );
  }

  if (visibleNotes.length === 0) {
    return <p className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">Опубликованных заметок пока нет</p>;
  }

  return (
    <ul className="space-y-2">
      {visibleNotes.map(({ doc, level, hasChildren, isExpanded }) => {
        const isPinned = doc._id === user.pined;
        const title = doc.title || "Без названия";

        return (
          <li key={doc._id} className="flex items-center gap-1.5 sm:gap-2" style={{ marginInlineStart: `min(${level}rem, 15%)` }}>
            <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-xl bg-muted/45 transition-colors hover:bg-muted/80 dark:bg-muted/15 dark:hover:bg-muted/30">
              {hasChildren && (
                <button
                  type="button"
                  className="ml-1.5 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-background/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  aria-label={isExpanded ? `Свернуть вложенные заметки «${title}»` : `Развернуть вложенные заметки «${title}»`}
                  aria-expanded={isExpanded}
                  onClick={() => setExpanded((current) => ({ ...current, [doc._id]: !isExpanded }))}
                >
                  <ChevronRight className={cn("size-4 motion-safe:transition-transform", isExpanded && "rotate-90")} />
                </button>
              )}
              <Link
                href={pages.VIEW(doc._id)}
                className="flex min-h-14 min-w-0 flex-1 items-center gap-2 px-3 py-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4"
              >
                {doc.icon ? (
                  <span className="grid size-6 shrink-0 place-items-center" aria-hidden="true">
                    <Twemoji>{doc.icon}</Twemoji>
                  </span>
                ) : (
                  <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                <span className="wrap-anywhere text-sm font-medium sm:text-base">{title}</span>
                {(doc.verified || doc.verifed) && <VerifedBadge text="Верифицированная заметка" size={5} />}
              </Link>
              {doc.coverImage && (
                <ProfileImage
                  key={doc.coverImage}
                  url={doc.coverImage}
                  sizes="(min-width: 640px) 192px, 64px"
                  className="relative h-14 w-16 shrink-0 self-center sm:w-36 lg:w-48"
                />
              )}
            </div>
            {canPin && (
              <button
                type="button"
                aria-label={isPinned ? `Открепить «${title}»` : `Закрепить «${title}»`}
                aria-pressed={isPinned}
                disabled={pinPending}
                onClick={() => void handlePinClick(doc._id)}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-amber-700 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 dark:text-amber-300"
              >
                <Pin className={cn("size-4", !isPinned && "rotate-45 text-muted-foreground")} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
