"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Twemoji from "react-twemoji";
import toast from "react-hot-toast";
import { LockKeyhole, Pin, Share2 } from "lucide-react";

import Error404 from "@/app/not-found";
import BackButton from "@/components/back-button";
import { Skeleton } from "@/components/ui/skeleton";
import { pages } from "@/config/routing/pages.route";
import { images } from "@/config/routing/image.route";
import { checkModerator, getUserByUsername } from "@/api/user";
import { getOrgByUsername } from "@/api/org";
import { API } from "@/config/routing/api.route";
import { Badges } from "./badge";
import { DocumentList } from "./documentList";
import { ProfileImage } from "./profile-image";
import { ModeratorPanel } from "./moderatorPanel";
import VerifedBadge from "./verifed";
import type { Org, User } from "@/config/types/api.types";
import type { DocumentTreeItem } from "@/config/types/main.types";
import type { ProfilePageComponentProps } from "@/config/types/profile.types";
import { useOrigin } from "@/components/hooks/use-origin";

const Editor = dynamic(() => import("@/components/editor"), { ssr: false });

type ProfileKind = "user" | "org";
type ProfileEntity = User | Org;

function isOrgProfile(profile: ProfileEntity): profile is Org {
  return profile._id.startsWith("org_");
}

function getProfileKind(profile: ProfileEntity): ProfileKind {
  return isOrgProfile(profile) ? "org" : "user";
}

function getProfileTitle(profile: ProfileEntity) {
  if (isOrgProfile(profile)) {
    return profile.name || profile.username;
  }

  const fullName = `${profile.firstname ?? ""} ${profile.lastname ?? ""}`.trim();
  return fullName || profile.username;
}

function canViewPrivateProfile(profile: ProfileEntity, isModerator: boolean, clerkUser: ReturnType<typeof useUser>["user"]) {
  if (!profile.privated) {
    return true;
  }

  if (isModerator) {
    return true;
  }

  if (isOrgProfile(profile)) {
    return profile.members?.includes(clerkUser?.id as string) || clerkUser?.id === profile.owner;
  }

  return clerkUser?.id === profile._id;
}

function getPrivateCopy(kind: ProfileKind, ownProfile: boolean) {
  if (kind === "org") {
    return ownProfile
      ? {
          title: "Приватная организация:",
          description: "Профиль организации является приватным. Только вы и участники могут видеть содержимое",
        }
      : {
          title: "Приватная организация:",
          description: "Этот профиль организации является приватным. Только участники могут видеть содержимое",
        };
  }

  return ownProfile
    ? {
        title: "Приватный профиль:",
        description: "Ваш профиль является приватным. Только вы можете видеть его содержимое",
      }
    : {
        title: "Приватный профиль:",
        description: "Этот профиль является приватным. Только владелец может его просматривать",
      };
}

function ProfileSkeleton() {
  return (
    <div className="page-glow min-h-screen px-4 pb-10 pt-20">
      <div className="mx-auto w-full max-w-[1380px] rounded-3xl bg-card/70 p-3 shadow-sm">
        <div className="flex flex-col">
          <Skeleton className="h-[320px] w-full rounded-2xl" />
          <div className="m-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-[100px] w-[100px] rounded-full" />
              <div>
                <Skeleton className="mb-2 h-8 w-[200px]" />
                <Skeleton className="h-6 w-[150px]" />
              </div>
            </div>
            <Skeleton className="hidden h-10 w-[120px] rounded-xl md:block" />
          </div>

          <Skeleton className="mb-3 ml-3 block h-10 w-[120px] rounded-xl md:hidden" />

          <hr className="border-black/10 dark:border-white/10" />

          <div className="mt-8">
            <Skeleton className="mb-4 h-8 w-[200px]" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage({ kind, slug }: ProfilePageComponentProps) {
  const origin = useOrigin();
  const { isLoaded, user } = useUser();
  const [profile, setProfile] = useState<ProfileEntity | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      setProfileLoading(true);

      const [profileData, viewerIsModerator] = await Promise.all([
        kind === "org" ? getOrgByUsername(slug) : getUserByUsername(slug),
        user?.id ? checkModerator(user.id) : false,
      ]);

      let profileIsModerator = false;
      if (profileData?._id) {
        try {
          profileIsModerator = await checkModerator(profileData._id);
        } catch {
          profileIsModerator = false;
        }
      }

      if (!active) return;

      setProfile(profileData ? { ...profileData, moderator: profileIsModerator } : null);
      setIsModerator(viewerIsModerator);
      setProfileLoading(false);
    };

    void fetchProfile();
    return () => { active = false; };
  }, [kind, slug, user?.id]);

  const pinnedId = profile?.pined;
  const showPrivateContent = Boolean(profile && canViewPrivateProfile(profile, isModerator, user));
  const { data: pinnedDocument, isLoading: pinnedLoading } = useQuery<DocumentTreeItem | null>({
    queryKey: ["document", pinnedId, profile?._id, "profile"],
    queryFn: async ({ signal }) => {
      if (!pinnedId || !profile) return null;
      const response = await fetch(API.DOCUMENTS.BY_ID(pinnedId), { signal });
      if (!response.ok) return null;
      const document: DocumentTreeItem = await response.json();
      return document.userId === profile._id && document.isPublished && !document.isPrivate && !document.isArchived
        ? document
        : null;
    },
    enabled: Boolean(isLoaded && !profileLoading && pinnedId && showPrivateContent),
  });

  if (!isLoaded || profileLoading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return <Error404 />;
  }

  const profileKind = getProfileKind(profile);
  const profileName = getProfileTitle(profile);
  const ownProfile = profileKind === "org" ? user?.id === profile.owner : user?.id === profile._id;
  const privateCopy = getPrivateCopy(profileKind, ownProfile);
  const verifiedBadgeText =
    profileKind === "org" ? "Верифицированная команда" : "Верифицированный пользователь";
  const profileCover = showPrivateContent ? pinnedDocument?.coverImage : undefined;

  const copyUsername = async (link = false) => {
    try {
      if (profile.username && navigator) {
        await navigator.clipboard.writeText(
          link ? pages.PROFILE_URL(origin, profileKind === "org", profile.username) : profile.username
        );
        toast.success(link ? "Ссылка скопирована!" : "Юзернейм скопирован!");
      }
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  const shareProfile = async () => {
    const profileUrl = pages.PROFILE_URL(origin, profileKind === "org", profile.username);

    try {
      if (navigator.share) {
        await navigator.share({
          title: profileName,
          text: `@${profile.username}`,
          url: profileUrl,
        });
        return;
      }

      await copyUsername(true);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      await copyUsername(true);
    }
  };

  return (
    <div className="page-glow min-h-screen px-3 pb-12 pt-20 sm:px-4">
      <div className="relative mx-auto w-full max-w-[1380px]">
        <BackButton className="mb-4 2xl:absolute 2xl:-left-14 2xl:top-0 2xl:mb-0" />
        <div className="rounded-3xl bg-card/70 p-3 shadow-sm sm:p-4">
          <ProfileImage
            key={profileCover ?? images.DEFAULTS.COVER}
            url={profileCover}
            fallback={images.DEFAULTS.COVER}
            sizes="(min-width: 1400px) 1348px, 100vw"
            className="relative h-36 overflow-hidden rounded-2xl bg-muted sm:h-52 lg:h-64"
          />

          <header className="flex flex-col items-start gap-3 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <ProfileImage
                key={profile.avatar}
                url={profile.avatar}
                fallback={images.ICONS.DEFAULT}
                sizes="(min-width: 640px) 80px, 56px"
                className="relative size-14 shrink-0 overflow-hidden rounded-full bg-muted sm:size-20"
              />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="wrap-anywhere text-xl font-bold leading-tight sm:text-3xl">
                    {profileName}
                    {profile.badges?.verified && (
                      <span className="ml-2 inline-flex align-middle">
                        <VerifedBadge text={verifiedBadgeText} size={profileKind === "org" ? 6 : 7} />
                      </span>
                    )}
                  </h1>
                  <ModeratorPanel user={profile} />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="text-link min-w-0 wrap-anywhere rounded text-left text-sm text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:text-base"
                    title="Скопировать имя пользователя"
                    onClick={() => void copyUsername()}
                  >
                    @{profile.username}
                  </button>
                  <button
                    type="button"
                    aria-label="Поделиться профилем"
                    onClick={() => void shareProfile()}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Share2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex max-w-full flex-wrap items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 md:shrink-0">
              <Badges profile={profile} />
            </div>
          </header>

          <div className="space-y-5 border-t border-border/70 pt-4 sm:space-y-6">
            {profile.privated && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50/80 p-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-100">
                <LockKeyhole className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <div>
                  <strong>{privateCopy.title}</strong>
                  <p>{privateCopy.description}</p>
                </div>
              </div>
            )}

            {showPrivateContent && (
              <>
                {pinnedLoading && <Skeleton className="h-20 rounded-xl" aria-label="Загрузка закреплённой заметки" />}
                {pinnedDocument && (
                  <article className="rounded-2xl bg-muted/35">
                    <div className="flex items-center gap-2 rounded-t-2xl bg-muted/45 px-3 py-2.5 sm:px-4">
                      <Pin className="size-4 shrink-0 -rotate-45 text-muted-foreground" aria-label="Закреплённая заметка" />
                      <h2 className="min-w-0">
                        <Link
                          className="text-link flex min-w-0 items-center gap-1.5 rounded font-semibold focus-visible:ring-2 focus-visible:ring-ring sm:text-lg"
                          href={pages.VIEW(pinnedDocument._id)}
                        >
                          {pinnedDocument.icon && (
                            <span className="grid size-6 shrink-0 place-items-center" aria-hidden="true">
                              <Twemoji>{pinnedDocument.icon}</Twemoji>
                            </span>
                          )}
                          <span className="wrap-anywhere">{pinnedDocument.title || "Без названия"}</span>
                          {(pinnedDocument.verified || pinnedDocument.verifed) && (
                            <VerifedBadge text="Верифицированная заметка" size={5} />
                          )}
                        </Link>
                      </h2>
                    </div>
                    {pinnedDocument.content && (
                      <Editor
                        key={pinnedDocument._id}
                        onChange={() => {}}
                        initialContent={pinnedDocument.content}
                        editable={false}
                        documentId={pinnedDocument._id}
                        className="[&>.preview-mode]:min-h-0 [&>.preview-mode]:px-3 [&>.preview-mode]:pb-4 [&_.tiptap-prototype-content]:min-h-0 [&_.tiptap-prototype-content]:wrap-anywhere sm:[&>.preview-mode]:px-5"
                      />
                    )}
                  </article>
                )}

                <section aria-labelledby="profile-notes">
                  <h2 id="profile-notes" className="mb-3 px-1 text-lg font-semibold sm:text-xl">Заметки</h2>
                  <DocumentList key={profile._id} user={profile} setProfile={setProfile} />
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
