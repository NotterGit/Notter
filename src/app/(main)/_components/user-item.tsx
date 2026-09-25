"use client"

import {
  useOrganization,
  useOrganizationList,
  useUser,
  useClerk,
} from "@clerk/nextjs"
import { pages } from "@/config/routing/pages.route"
import Link from "next/link"
import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  ChevronRight,
  Check,
  Settings,
  Loader2,
  Building2,
  ChevronUp,
  LogOut,
  User as UserIcon,
} from "lucide-react"
import Image from "next/image"
import { images } from "@/config/routing/image.route"
import { normalizeImageUrl } from "@/lib/image-url"
import { getUserById } from "@/api/user"
import { getOrgById } from "@/api/org"
import { useEffect, useState, useRef } from "react"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"

export function UserItem() {
  const { user } = useUser()
  const { organization } = useOrganization()
  const {
    isLoaded: isOrgListLoaded,
    setActive: setActiveOrg,
    userMemberships,
  } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  })
  const clerk = useClerk()

  const isOrg = organization?.id !== undefined
  const [profile, setProfile] = useState<any | null>(null)
  const [switchingOrgId, setSwitchingOrgId] = useState<string | null>(null)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAccountMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isAccountMenuOpen])

  const userImage =
    normalizeImageUrl(
      (user as any)?.imageUrl || (user as any)?.profileImageUrl || (user as any)?.image || null
    ) ||
    (user as any)?.imageUrl ||
    (user as any)?.profileImageUrl ||
    (user as any)?.image ||
    null

  const orgImage =
    normalizeImageUrl((organization as any)?.imageUrl || null) ||
    (organization as any)?.imageUrl ||
    null

  const displayName = isOrg
    ? organization?.name || organization?.slug || "Организация"
    : user?.username ?? user?.fullName ?? "Пользователь"

  const currentImage = isOrg ? orgImage : userImage
  const fallbackLetter = displayName.charAt(0).toUpperCase()

  const userEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    ""

  const bottomAvatar = isOrg ? orgImage : userImage
  const bottomTitle = isOrg
    ? organization?.name || organization?.slug || "Организация"
    : user?.username ?? user?.fullName ?? "Пользователь"
  const bottomSubtitle = isOrg
    ? organization?.slug ? `@${organization.slug}` : "Организация"
    : userEmail
  const bottomFallback = bottomTitle.charAt(0).toUpperCase()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (isOrg && organization?.id) {
          const org = await getOrgById(organization.id)
          setProfile(org)
          return
        }

        if (!isOrg && user?.id) {
          const u = await getUserById(user.id)
          setProfile(u)
        }
      } catch (e) {}
    }

    fetchProfile()
  }, [isOrg, organization?.id, user?.id])

  const handleSelectOrg = async (orgId: string | null) => {
    const currentOrgId = organization?.id ?? null
    if (orgId === currentOrgId) return
    try {
      setSwitchingOrgId(orgId === null ? "personal" : orgId)
      if (setActiveOrg) {
        await setActiveOrg({ organization: orgId })
      } else if (clerk.setActive) {
        await clerk.setActive({ organization: orgId })
      }
      window.location.href = pages.DASHBOARD()
    } catch (e) {
      setSwitchingOrgId(null)
      toast.error("Не удалось переключить организацию")
    }
  }

  const handleCreateOrg = () => {
    if (typeof clerk?.openCreateOrganization === "function") {
      clerk.openCreateOrganization()
    }
  }

  return (
    <div className="mr-6">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-2 rounded-xl border border-transparent p-2 transition hover:border-black/10 hover:bg-white/70 dark:hover:border-white/10 dark:hover:bg-zinc-900/70">
            <Avatar className="h-6 w-6 ring-1 ring-border/60">
              {currentImage ? (
                <AvatarImage src={currentImage} alt={displayName} className="object-cover" />
              ) : (
                <AvatarFallback className="text-sm">{fallbackLetter}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm font-medium truncate max-w-[8rem] ${
                  profile?.premium === 1
                    ? "bg-gradient-to-b from-[#FFEB9C] to-[#FFDB4A] bg-clip-text text-transparent"
                    : profile?.premium === 2
                    ? "bg-gradient-to-b from-[#2BD8FF] to-[#94AAF3] bg-clip-text text-transparent"
                    : "text-muted-foreground"
                }`}
              >
                {displayName}
              </span>

              {profile?.premium === 1 && (
                <Image
                  src={images.BADGES.AMBER}
                  alt="Amber"
                  width={14}
                  height={14}
                  className="object-contain relative right-0.5"
                />
              )}

              {profile?.premium === 2 && (
                <Image
                  src={images.BADGES.DIAMOND}
                  alt="Diamond"
                  width={14}
                  height={14}
                  className="object-contain relative right-0.5"
                />
              )}
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="ml-1 flex w-64 flex-col items-start rounded-xl border-white/60 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-zinc-950 overflow-visible"
          align="start"
        >
          {/* Quick-switch Workspaces / Organizations list */}
          <div className="w-full">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Пространства
            </div>
            <div className="flex flex-col gap-0.5">
              {/* Personal Workspace item */}
              <button
                type="button"
                disabled={!isOrg || Boolean(switchingOrgId)}
                onClick={() => handleSelectOrg(null)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition",
                  !isOrg
                    ? "bg-accent/60 font-medium text-foreground cursor-default"
                    : "text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10 cursor-pointer"
                )}
              >
                <Avatar className="h-6 w-6 ring-1 ring-border/60 shrink-0">
                  {userImage ? (
                    <AvatarImage src={userImage} alt={user?.username ?? "user"} className="object-cover" />
                  ) : (
                    <AvatarFallback className="text-[10px]">
                      {(user?.username || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate text-xs leading-none text-foreground">
                    {user?.username ?? user?.fullName ?? "Личный кабинет"}
                  </span>
                  <span className="truncate text-[10px] text-muted-foreground mt-0.5">
                    Личное пространство
                  </span>
                </div>
                {switchingOrgId === "personal" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0 ml-auto" />
                ) : !isOrg ? (
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-auto" />
                ) : null}
              </button>

              {/* Organization items */}
              {isOrgListLoaded &&
                userMemberships?.data?.map((mem) => {
                  const org = mem.organization
                  const isActive = organization?.id === org.id
                  const isThisSwitching = switchingOrgId === org.id
                  const orgAvatar = normalizeImageUrl(org.imageUrl || null) || org.imageUrl

                  return (
                    <button
                      key={org.id}
                      type="button"
                      disabled={isActive || Boolean(switchingOrgId)}
                      onClick={() => handleSelectOrg(org.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition",
                        isActive
                          ? "bg-accent/60 font-medium text-foreground cursor-default"
                          : "text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10 cursor-pointer"
                      )}
                    >
                      <Avatar className="h-6 w-6 ring-1 ring-border/60 shrink-0">
                        {orgAvatar ? (
                          <AvatarImage src={orgAvatar} alt={org.name} className="object-cover" />
                        ) : (
                          <AvatarFallback className="text-[10px]">
                            {org.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate text-xs leading-none text-foreground">
                          {org.name}
                        </span>
                        <span className="truncate text-[10px] text-muted-foreground mt-0.5">
                          Организация
                        </span>
                      </div>
                      {isThisSwitching ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0 ml-auto" />
                      ) : isActive ? (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-auto" />
                      ) : null}
                    </button>
                  )
                })}
            </div>

            <div className="flex items-center gap-1 mt-1">
              <button
                type="button"
                onClick={handleCreateOrg}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10 cursor-pointer"
              >
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span>Создать организацию</span>
              </button>
            </div>
          </div>

          <DropdownMenuSeparator className="my-2 w-full" />

          {/* Active Workspace Container (Organization or Personal) at the bottom */}
          <div ref={accountMenuRef} className="relative w-full">
            {/* Pop-up menu appearing ABOVE the container */}
            {isAccountMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1.5 z-50 rounded-xl border border-white/60 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2">
                {isOrg ? (
                  <>
                    <Link
                      href={pages.PROFILE(true, organization?.slug ?? "")}
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Перейти в профиль</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false)
                        clerk?.openOrganizationProfile?.()
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                    >
                      <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Настройки организации</span>
                    </button>

                    <DropdownMenuSeparator className="my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false)
                        clerk?.openUserProfile?.()
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10 cursor-pointer"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Настройки аккаунта</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={pages.PROFILE(false, user?.username ?? "")}
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Перейти в профиль</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false)
                        clerk?.openUserProfile?.()
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                    >
                      <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Настройки аккаунта</span>
                    </button>
                  </>
                )}

                <DropdownMenuSeparator className="my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false)
                    clerk?.signOut?.()
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-destructive transition hover:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-destructive" />
                  <span>Выйти из аккаунта</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl p-2 text-left transition hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer",
                isAccountMenuOpen && "bg-black/5 dark:bg-white/10"
              )}
            >
              <Avatar className="h-8 w-8 ring-1 ring-border/60 shrink-0">
                {bottomAvatar ? (
                  <AvatarImage src={bottomAvatar} alt={bottomTitle} className="object-cover" />
                ) : (
                  <AvatarFallback className="text-xs">
                    {bottomFallback}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-xs font-medium text-foreground leading-tight">
                  {bottomTitle}
                </span>
                {bottomSubtitle && (
                  <span className="truncate text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {bottomSubtitle}
                  </span>
                )}
              </div>
              <ChevronUp
                className={cn(
                  "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
                  isAccountMenuOpen && "rotate-180"
                )}
              />
            </button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
