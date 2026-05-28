import { cn } from "@/lib/utils";
import { FileIcon } from "lucide-react";
import Image from "next/image";
import { Pin } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Twemoji from "react-twemoji";
import { Id } from "../../../../convex/_generated/dataModel";
import toast from "react-hot-toast";
import { updateUser } from "../../api/users/user";
import { useUser } from "@clerk/nextjs";
import VerifedBadge from "./verifed";
import { updateOrg } from "../../api/orgs/org";
import Link from "next/link";
import { pages } from "@/config/routing/pages.route";
import type { DocumentListProps } from "@/config/types/profile.types";

export function DocumentList({
  user,
  profile,
  setProfile,
  parentDocumentId,
  level = 0,
  publicSorted = true,
}: DocumentListProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { user: clerkUser } = useUser();
  const isOrg = user._id.startsWith("org_")

  const documents = useQuery(api.document.getSidebar, {
    parentDocument: parentDocumentId,
    userId: user?._id,
    publicSorted,
  });

  const onToggleExpand = (documentId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [documentId]: !prev[documentId],
    }));
  };

  const handlePinClick = async (docId: string) => {
    try {
      let updatedUser;
      
      if (docId === user?.pined) {
        updatedUser = isOrg ? 
          await updateOrg(user._id, null, null, null, null, null, "") : 
          await updateUser(user._id, null, null, null, null, null, "");
        if (updatedUser) {
          toast.success("Note unpinned successfully!");
          setProfile((prevProfile) => {
            if (prevProfile) {
              return { ...prevProfile, pined: null };
            }
            return prevProfile;
          });
        }
      } else {
        updatedUser = isOrg ? 
          await updateOrg(user._id, null, null, null, null, null, docId) : 
          await updateUser(user._id, null, null, null, null, null, docId);
        if (updatedUser) {
          toast.success("Note pinned successfully!");
          setProfile((prevProfile) => {
            if (prevProfile) {
              return { ...prevProfile, pined: docId };
            }
            return prevProfile;
          });
        }
      }
    } catch (error) {
      toast.error("Failed to pin/unpin the note");
    }
  };

  if (documents === undefined) {
    return (
      <>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 p-1">
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ))}
      </>
    );
  }

  if (documents.length === 0 && level === 0) {
    return <p className="ml-2 rounded-xl border border-black/5 bg-background/60 px-3 py-2 text-sm text-muted-foreground dark:border-white/10">Пусто</p>;
  }

  return (
    <div className="space-y-2">
      <Twemoji>
        {documents.map((doc) => {
          const isExpanded = expanded[doc._id];

          if (doc.isPublished || !publicSorted) {
            return (
              <div key={doc._id} style={{ paddingLeft: level * 20 }}>
                <div className="m-2 flex items-center gap-2">
                  <div
                    onClick={() => onToggleExpand(doc._id)}
                    className={cn(
                      "group flex flex-1 cursor-pointer items-center justify-between overflow-hidden rounded-2xl border border-black/10 bg-background/70 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10"
                    )}
                  >
                    <div className={`flex items-center gap-2 px-4 py-3 ${!doc.coverImage ? "" : ""}`}>
                      {doc.icon ? (
                        <span
                          className={`inline-block h-6 w-6 ${doc.coverImage && "ml-1"}`}
                          style={{ lineHeight: 0 }}
                        >
                          {doc.icon}
                        </span>
                      ) : (
                        <FileIcon
                          className={`h-5 w-5 text-muted-foreground ${doc.coverImage && "ml-1"}`}
                        />
                      )}

                      <Link
                        href={pages.VIEW(doc._id)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-lg text-primary/80 transition-all duration-300 hover:text-primary"
                      >
                        {doc.title}
                      </Link>

                      {doc.verifed && (
                        <VerifedBadge text="Заметка верефицирована командой Qualsu" size={6}/>
                      )}
                    </div>

                    {doc.coverImage && (
                      <div className="relative ml-auto h-16 w-56 overflow-hidden border-l border-black/10 dark:border-white/10 md:w-64">
                        <Image
                          src={doc.coverImage}
                          alt={doc.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {(clerkUser?.id === user._id || (user.owner === clerkUser?.id && clerkUser?.id)) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(doc._id);
                      }}
                      className="rounded-md border border-black/10 bg-background/80 p-1.5 transition hover:bg-background dark:border-white/10"
                    >
                      {doc._id === user?.pined  ? (
                        <Pin className="h-5 w-5 text-yellow-500 transition-all duration-200 hover:text-yellow-600" />
                      ) : (
                        <Pin className="h-5 w-5 rotate-45 text-yellow-500 opacity-60 transition-all duration-200 hover:opacity-100" />
                      )}
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="ml-8 border-l border-black/10 pl-3 dark:border-white/10">
                    <DocumentList
                      user={user}
                      profile={profile}
                      setProfile={setProfile}
                      parentDocumentId={doc._id}
                      level={level + 1}
                      publicSorted={publicSorted}
                    />
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={doc._id}>
              <DocumentList
                user={user}
                parentDocumentId={doc._id}
                profile={profile}
                setProfile={setProfile}
                level={0}
                publicSorted={publicSorted}
              />
            </div>
          );
        })}
      </Twemoji>
    </div>
  );
}
