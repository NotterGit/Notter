"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import Twemoji from "react-twemoji";
import toast from "react-hot-toast";
import { LockKeyhole, Pin, Share2 } from "lucide-react";

import Error404 from "@/app/not-found";
import BackButton from "@/components/back-button";
import { Cover } from "@/components/cover";
import { Skeleton } from "@/components/ui/skeleton";
import { pages } from "@/config/routing/pages.route";
import { images } from "@/config/routing/image.route";
import { getById as getUserById, getByUsername as getUserByUsername } from "@/app/api/users/user";
import { getByUsername as getOrgByUsername } from "@/app/api/orgs/org";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Badges } from "./badge";
import { DocumentList } from "./documentList";
import { ModeratorPanel } from "./moderatorPanel";
import VerifedBadge from "./verifed";
import type { Org, User } from "@/config/types/api.types";
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

function canViewPrivateProfile(profile: ProfileEntity, viewer: User | null, clerkUser: ReturnType<typeof useUser>["user"]) {
  if (!profile.privated) {
    return true;
  }

  if (viewer?.moderator) {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-logo-yellow/10 px-4 pb-10 pt-20 dark:to-logo-cyan/10">
      <div className="mx-auto w-full max-w-[1380px] rounded-3xl border border-white/50 bg-white/75 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/75">
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
  const [account, setAccount] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);

      const [profileData, accountData] = await Promise.all([
        kind === "org" ? getOrgByUsername(slug) : getUserByUsername(slug),
        user?.id ? getUserById(user.id) : Promise.resolve(null),
      ]);

      setProfile(profileData);
      setAccount(accountData);
      setProfileLoading(false);
    };

    fetchProfile();
  }, [kind, slug, user?.id]);

  const document = useQuery(api.document.getById, {
    userId: profile?._id,
    documentId: profile?.pined ? (profile.pined as Id<"documents">) : null,
  });

  if (!isLoaded || profileLoading || document === undefined) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return <Error404 />;
  }

  const profileKind = getProfileKind(profile);
  const profileName = getProfileTitle(profile);
  const ownProfile = profileKind === "org" ? user?.id === profile.owner : user?.id === profile._id;
  const canViewPrivate = canViewPrivateProfile(profile, account, user);
  const privateCopy = getPrivateCopy(profileKind, ownProfile);
  const verifiedBadgeText =
    profileKind === "org" ? "Верифицированная команда" : "Верифицированный пользователь";

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

  const pinnedDocument = document ?? null;
  const showPinnedDocument = pinnedDocument !== null;
  const showPrivateContent = !profile.privated || canViewPrivate;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-logo-yellow/10 px-4 pb-12 pt-20 dark:to-logo-cyan/10">
        <div className="pointer-events-none absolute left-0 top-24 h-72 w-72 rounded-full bg-logo-light-yellow/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-64 h-72 w-72 rounded-full bg-logo-cyan/15 blur-3xl" />

        <div className="relative mx-auto w-full max-w-[1380px]">
          <BackButton className="mb-4 2xl:absolute 2xl:-left-14 2xl:top-0 2xl:mb-0 xl:-left-16" />
          <div className="flex w-full flex-col rounded-3xl border border-white/50 bg-white/75 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/75">
          <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
            <Cover url={document?.coverImage || images.DEFAULT.COVER} preview />
          </div>

          <div className="relative my-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image
                  src={profile.avatar || images.DEFAULT.PROFILE}
                  alt={profileKind === "org" ? "Org Avatar" : "Profile Picture"}
                  width={80}
                  height={80}
                  className="rounded-full ring-2 ring-white/70 dark:ring-white/15"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold leading-tight">
                    <span>{profileName}</span>
                    {profile.badges.verified && (
                      <span className="ml-2 inline-flex translate-y-[-0.08em] align-middle">
                        <VerifedBadge text={verifiedBadgeText} size={profileKind === "org" ? 6 : 7} clicked={false} />
                      </span>
                    )}
                  </h1>

                  <ModeratorPanel user={profile} />
                </div>

                <span className="flex items-center gap-1.5">
                  <p
                    className="inline-flex cursor-pointer rounded-lg bg-background/70 py-1 text-base text-primary/80 transition-all duration-300 hover:text-primary"
                    onClick={() => {
                      copyUsername();
                    }}
                  >
                    @{profile.username}
                  </p>
                  <Share2
                    className="h-5 w-5 text-primary/80 transition-all duration-300 hover:text-primary"
                    onClick={shareProfile}
                  />
                </span>
              </div>
            </div>

            <div className="mt-2 flex max-w-max flex-row items-center gap-2 rounded-2xl border border-black/5 bg-background/70 p-2.5 shadow-sm dark:border-white/10 md:mt-0">
              <Badges profile={profile} />
            </div>
          </div>

          <hr className="border-black/10 dark:border-white/10" />

          {profile.privated && !showPrivateContent ? (
            <div className="my-4 flex flex-col items-center justify-center rounded-2xl border border-amber-300/50 bg-amber-50/80 p-4 text-amber-800 dark:border-amber-300/20 dark:bg-amber-900/30 dark:text-amber-100">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-6 w-6 text-amber-500" />
                <strong>{privateCopy.title}</strong>
              </div>
              <p className="text-center">{privateCopy.description}</p>
            </div>
          ) : (
            <>
              {profile.privated && (
                <div className="my-4 flex flex-col items-center justify-center rounded-2xl border border-amber-300/50 bg-amber-50/80 p-4 text-amber-800 dark:border-amber-300/20 dark:bg-amber-900/30 dark:text-amber-100">
                  <div className="flex items-center gap-2">
                    <LockKeyhole className="h-6 w-6 text-amber-500" />
                    <strong>{privateCopy.title}</strong>
                  </div>
                  <p className="text-center">{privateCopy.description}</p>
                </div>
              )}

              {showPinnedDocument && (
                <>
                  <div className="my-4 flex flex-row items-center rounded-xl border border-black/5 bg-background/70 px-3 py-2 text-muted-foreground dark:border-white/10">
                    <Pin className="mr-1 h-5 w-5 -rotate-45" />
                    {pinnedDocument?.icon && (
                      <span className="m-1 inline-block h-6 w-6" style={{ lineHeight: 0 }}>
                        <Twemoji>{pinnedDocument.icon}</Twemoji>
                      </span>
                    )}
                    <Link
                      className="flex flex-row items-center gap-1.5 text-xl transition-all duration-300 hover:text-primary/70"
                      href={pages.VIEW(pinnedDocument._id)}
                    >
                      <span className="font-bold">{pinnedDocument.title}</span>
                      {pinnedDocument.verifed && (
                        <VerifedBadge text="Заметка верифицирована командой Qualsu" size={6} />
                      )}
                    </Link>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-background/70 pt-6 shadow-sm dark:border-white/10">
                    <Editor
                      onChange={() => {}}
                      initialContent={pinnedDocument.content}
                      editable={false}
                      documentId={pinnedDocument._id}
                    />
                  </div>
                </>
              )}

              <div className="mt-8">
                <h2 className="mx-2 mb-4 text-2xl font-bold">Заметки</h2>
                <DocumentList user={profile} profile={slug} setProfile={setProfile} />
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </>
  );
}
