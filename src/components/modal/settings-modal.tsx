import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { ModeToggle } from "../mode-toggle"
import { useSettings } from "../hooks/use-settings"
import { Label } from "../ui/label"
import { Separator } from "@radix-ui/react-dropdown-menu"
import { SignOutButton, useOrganization, useClerk, useUser } from "@clerk/nextjs"
import { useWorkspaceAdmin } from "@/components/hooks/use-workspace-admin"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { getUserById, updateUser } from "@/api/user"
import { getOrgById, updateOrg } from "@/api/org"
import { pages } from "@/config/routing/pages.route"
import { Button } from "../ui/button"
import { useRef } from "react"
import { Check, ChevronDown, LogOut, Settings, User } from "lucide-react"
import { isDesktopApp } from "@/lib/desktop-app"
import { VersionBadge } from "../version-badge"
import { cn } from "@/lib/utils"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { toast } from "react-hot-toast"
import Image from "next/image"
import { images } from "@/config/routing/image.route"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ARCHIVE_RETENTION_OPTIONS,
  DEFAULT_RETENTION_DAYS,
  isArchiveRetentionAllowed,
  pluralize,
} from "@/lib/archive"

const readRedirectPreference = () => {
  if (typeof window === "undefined") return false

  const localValue = localStorage.getItem("redirect")
  if (localValue !== null) {
    return localValue === "true"
  }

  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("redirect="))
    ?.split("=")[1] === "true"
}

export function SettingsModal() {
  const settings = useSettings()
  const router = useRouter()
  const { user } = useUser()
  const clerk = useClerk()
  const { organization } = useOrganization()
  const { isOrg, isAdmin } = useWorkspaceAdmin()
  const [isPrivated, setIsPrivated] = useState<boolean>(false)
  const [watermark, setWatermark] = useState<boolean>(false)
  const [redirect, setRedirect] = useState<boolean>(false)
  const [isDesktop, setIsDesktop] = useState<boolean>(false)
  const [userData, setUserData] = useState<any>(null)
  const id = isOrg ? organization?.id : user?.id

  const canEdit = (userData?.owner === user?.id || isAdmin) || !isOrg
  const archiveSettings = useQuery(
    api.document.getArchiveSettings,
    id ? { userId: id } : "skip"
  )
  const setArchiveRetention = useMutation(api.document.setArchiveRetention)
  const [retentionDays, setRetentionDays] = useState<number>(DEFAULT_RETENTION_DAYS)

  useEffect(() => {
    if (archiveSettings?.retentionDays !== undefined) {
      setRetentionDays(archiveSettings.retentionDays)
    }
  }, [archiveSettings?.retentionDays])

  const handleRetentionChange = async (days: number) => {
    if (!canEdit) return

    const premium = userData?.premium ?? 0
    if (!isArchiveRetentionAllowed(days, premium)) {
      return
    }

    setRetentionDays(days)

    if (id) {
      try {
        await setArchiveRetention({
          userId: id,
          retentionDays: days,
          premiumLevel: premium,
        })
        toast.success(`Автоочистка архива: ${days} ${pluralize(days, "день", "дня", "дней")}`)
      } catch {
        toast.error("Не удалось обновить настройки архива")
      }
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const data = isOrg ? await getOrgById(id) : await getUserById(id)
        if (data) {
          setUserData(data)
          setIsPrivated(data.privated || false)
          setWatermark(data.watermark || false)
        }
      }
    }

    fetchData()

    setIsDesktop(isDesktopApp())
    setRedirect(readRedirectPreference())
  }, [id, isOrg])

  const handlePrivacyToggle = async (value: boolean) => {
    if (isOrg && !isAdmin && userData?.owner !== user?.id) return
    setIsPrivated(value)

    if (id) {
      if (isOrg) {
        await updateOrg(id, { privated: value })
      } else {
        await updateUser(id, { privated: value })
      }

      return null
    }
  }

  const handleWatermarkToggle = async (value: boolean) => {
    if (isOrg && !isAdmin && userData?.owner !== user?.id) return
    setWatermark(value)

    if (id) {
      if (isOrg) {
        await updateOrg(id, { watermark: value })
      } else {
        await updateUser(id, { watermark: value })
      }
    }
  }

  const handleRedirectToggle = async (value: boolean) => {
    setRedirect(value)

    localStorage.setItem("redirect", value ? "true" : "false")
    document.cookie = `redirect=${value ? "true" : "false"}; Path=/; Max-Age=31536000; SameSite=Lax`
  }

  // backdrop modal (simplified)

  const backdropId = "clerk-backdrop-overlay"
  const intervalRef = useRef<number | null>(null)

  const addBackdrop = () => {
    if (typeof document === "undefined") return
    if (document.getElementById(backdropId)) return

    const el = document.createElement("div")
    el.id = backdropId
    Object.assign(el.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.45)",
      zIndex: "9998",
      pointerEvents: "auto",
    })

    document.body.appendChild(el)
  }

  const removeBackdrop = () => {
    if (typeof document === "undefined") return
    const el = document.getElementById(backdropId)
    if (el) el.remove()
  }

  const watchForClerkModal = () => {
    if (typeof document === "undefined") return

    const selectors = [
      '[data-clerk-portal]',
      '[data-clerk-root]',
      '.clerk-root',
      '.clerk-modal',
      '[id^="clerk"]',
      '[id^="__clerk"]',
    ]

    const hasClerk = () => selectors.some(s => !!document.querySelector(s))

    const start = Date.now()
    if (intervalRef.current) return

    intervalRef.current = window.setInterval(() => {
      if (!hasClerk() || Date.now() - start > 60000) {
        removeBackdrop()
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }, 200)
  }

  useEffect(() => {
    if (!settings.isOpen) {
      removeBackdrop()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [settings.isOpen])

  useEffect(() => {
    return () => {
      removeBackdrop()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  // backdrop modal end

  return (
    <Dialog open={settings.isOpen} onOpenChange={settings.onClose}>
      <DialogContent>
        <DialogHeader className="border-b pb-3">
          <h2 className="text-lg font-medium">Настройки</h2>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-1">
            <Label>Тема</Label>
            <span className="text-[0.8rem] text-muted-foreground">
              Настройте Notter для комфортной работы
            </span>
          </div>
          <ModeToggle />
        </div>

        <div className={isDesktop ? "hidden" : "flex items-center justify-between"}>
          <div className="flex flex-col gap-y-1">
            <Label>Редирект</Label>
            <span className="text-[0.8rem] text-muted-foreground w-full max-w-[350px]">
              При переходе на главную страницу &apos;/&apos; перенаправлять на дашборд
            </span>
          </div>
          <Switch
            checked={redirect}
            onCheckedChange={handleRedirectToggle}
          />
        </div>

        {((userData?.owner === user?.id || isAdmin) || !isOrg) && (
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-y-1">
              <Label>Приватный профиль</Label>
              <span className="text-[0.8rem] text-muted-foreground">
                Скройте свои заметки от лишних глаз
              </span>
            </div>
            
              <Switch
                checked={isPrivated}
                onCheckedChange={handlePrivacyToggle}
              />
          </div>
        )}

        {userData?.premium === 2 && ((userData?.owner === user?.id || isAdmin) || !isOrg) && (
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-y-1">
              <Label>Логотип Notter</Label>
              <span className="text-[0.8rem] text-muted-foreground">
                Показывать логотип на публичных заметках
              </span>
            </div>
            <Switch
              checked={watermark}
              onCheckedChange={handleWatermarkToggle}
            />
          </div>
        )}

        {canEdit && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-y-1">
              <Label>Очистка архива</Label>
              <span className="text-[0.8rem] text-muted-foreground max-w-[320px]">
                Автоматически удалять заметки из архива через выбранный срок
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-3 text-xs font-normal shrink-0 border-border/70 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <span>{retentionDays} {pluralize(retentionDays, "день", "дня", "дней")}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {ARCHIVE_RETENTION_OPTIONS.map((option) => {
                  const isAllowed = isArchiveRetentionAllowed(option.days, userData?.premium ?? 0)
                  const isSelected = retentionDays === option.days

                  return (
                    <DropdownMenuItem
                      key={option.days}
                      disabled={!isAllowed}
                      onClick={() => {
                        if (isAllowed) {
                          handleRetentionChange(option.days)
                        }
                      }}
                      className={cn(
                        "flex items-center justify-between gap-2 text-xs py-2",
                        !isAllowed ? "opacity-40 cursor-not-allowed select-none" : "cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span>{option.days} {pluralize(option.days, "день", "дня", "дней")}</span>
                        {option.gemName === "Amber" && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-500 border border-amber-500/20">
                            <Image
                              src={images.BADGES.AMBER}
                              alt="Amber"
                              width={12}
                              height={12}
                              className="shrink-0"
                            />
                            Amber
                          </span>
                        )}
                        {option.gemName === "Diamond" && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-500 border border-cyan-500/20">
                            <Image
                              src={images.BADGES.DIAMOND}
                              alt="Diamond"
                              width={12}
                              height={12}
                              className="shrink-0"
                            />
                            Diamond
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-primary ml-auto" />
                      )}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <Separator />

        <section className="flex flex-col md:flex-row justify-center items-center gap-3">
          <div className="w-full flex justify-center md:w-auto">
            <Button
              onClick={() => {
                addBackdrop()
                watchForClerkModal()
                clerk?.openUserProfile?.()
                settings.onClose()
              }}
              variant={"outline"}
            >
              <Settings/> Настройки аккаунта 
            </Button>
          </div>
          <div
            onClick={() => {
              router.push(pages.ROOT)
              settings.onClose()
            }}
            className="w-full flex justify-center md:w-auto hover:text-primary/80"
          >
            <SignOutButton>
              <Button variant={"destructive"}>
                <LogOut/> Выйти из аккаунта
              </Button>
            </SignOutButton>
          </div>
        </section>

        <VersionBadge className="block text-center text-[0.7rem] text-muted-foreground select-none" />
      </DialogContent>
    </Dialog>
  )
}

