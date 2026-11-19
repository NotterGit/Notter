import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ModeToggle } from "../mode-toggle"
import { useSettings } from "../hooks/use-settings"
import { Label } from "../ui/label"
import { SignOutButton, useOrganization, useClerk, useUser } from "@clerk/nextjs"
import { useWorkspaceAdmin } from "@/components/hooks/use-workspace-admin"
import { useRouter } from "next/navigation"
import { useState, useEffect, useId } from "react"
import { Switch } from "@/components/ui/switch"
import { getUserById, updateUser } from "@/api/user"
import { getOrgById, updateOrg } from "@/api/org"
import { pages } from "@/config/routing/pages.route"
import { Button } from "../ui/button"
import { useRef } from "react"
import { Check, ChevronDown, LogOut, Settings } from "lucide-react"
import { isDesktopApp } from "@/lib/desktop-app"
import { cn } from "@/lib/utils"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { API } from "@/config/routing/api.route"
import { fetcher } from "@/lib/fetcher"
import { setArchiveRetention as setArchiveRetentionAction } from "@/actions/set-archive-retention"
import { useAction } from "@/hooks/use-action"
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
import { AiAgentSettings } from "./ai-agent-settings"

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
  const fieldId = useId()
  const settings = useSettings()
  const router = useRouter()
  const { user } = useUser()
  const clerk = useClerk()
  const { organization } = useOrganization()
  const { isOrg, isAdmin } = useWorkspaceAdmin()
  const queryClient = useQueryClient()
  const [isPrivated, setIsPrivated] = useState<boolean>(false)
  const [watermark, setWatermark] = useState<boolean>(false)
  const [redirect, setRedirect] = useState<boolean>(false)
  const [isDesktop, setIsDesktop] = useState<boolean>(false)
  const [userData, setUserData] = useState<any>(null)
  const id = isOrg ? organization?.id : user?.id

  const canEdit = (userData?.owner === user?.id || isAdmin) || !isOrg
  const { data: archiveSettings } = useQuery<{ retentionDays: number }>({
    queryKey: ["archive-settings", id],
    queryFn: () => fetcher(API.DOCUMENTS.ARCHIVE_SETTINGS(id)),
    enabled: Boolean(id),
  })
  const { execute: executeSetArchiveRetention } = useAction(setArchiveRetentionAction, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive-settings", id] })
    },
  })
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
        await executeSetArchiveRetention({
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

  return (
    <Dialog open={settings.isOpen} onOpenChange={settings.onClose}>
      <DialogContent className="custom-scrollbar max-h-[85dvh] gap-3 overflow-y-auto border-0 p-4 sm:p-6" aria-describedby={undefined}>
        <DialogHeader className="text-left">
          <DialogTitle>Настройки</DialogTitle>
        </DialogHeader>

        <div>
          <div className="flex min-h-11 items-center justify-between gap-3 py-1">
            <span className="text-sm font-medium">Тема</span>
            <ModeToggle variant="secondary" />
          </div>

          {!isDesktop && (
            <div className="flex min-h-11 items-center gap-3">
              <Label htmlFor={`${fieldId}-redirect`} className="flex min-h-11 flex-1 cursor-pointer items-center text-pretty">
                Открывать дашборд вместо главной
              </Label>
              <Switch
                id={`${fieldId}-redirect`}
                checked={redirect}
                onCheckedChange={handleRedirectToggle}
              />
            </div>
          )}

          {canEdit && (
            <div className="flex min-h-11 items-center gap-3">
              <Label htmlFor={`${fieldId}-privacy`} className="flex min-h-11 flex-1 cursor-pointer items-center">
                Приватный профиль
              </Label>
              <Switch
                id={`${fieldId}-privacy`}
                checked={isPrivated}
                onCheckedChange={handlePrivacyToggle}
              />
            </div>
          )}

          {canEdit && userData?.premium === 2 && (
            <div className="flex min-h-11 items-center gap-3">
              <Label htmlFor={`${fieldId}-watermark`} className="flex min-h-11 flex-1 cursor-pointer items-center text-pretty">
                Логотип Notter на публичных заметках
              </Label>
              <Switch
                id={`${fieldId}-watermark`}
                checked={watermark}
                onCheckedChange={handleWatermarkToggle}
              />
            </div>
          )}

          {canEdit && (
            <div className="flex min-h-11 items-center justify-between gap-3 py-1">
              <span id={`${fieldId}-retention`} className="text-sm font-medium text-pretty">Автоудаление из архива</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    aria-labelledby={`${fieldId}-retention ${fieldId}-retention-value`}
                    className="shrink-0 gap-1.5 font-normal"
                  >
                    <span id={`${fieldId}-retention-value`}>{retentionDays} {pluralize(retentionDays, "день", "дня", "дней")}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-0">
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
                          "flex items-center justify-between gap-2 py-2",
                          !isAllowed ? "opacity-40 cursor-not-allowed select-none" : "cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span>{option.days} {pluralize(option.days, "день", "дня", "дней")}</span>
                          {option.gemName === "Amber" && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                              <Image
                                src={images.BADGES.AMBER}
                                alt=""
                                width={12}
                                height={12}
                                className="shrink-0"
                              />
                              Amber
                            </span>
                          )}
                          {option.gemName === "Diamond" && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 dark:text-cyan-400">
                              <Image
                                src={images.BADGES.DIAMOND}
                                alt=""
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
        </div>

        <AiAgentSettings />

        <DialogFooter className="flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between sm:space-x-0">
          <Button
            onClick={() => {
              addBackdrop()
              watchForClerkModal()
              clerk?.openUserProfile?.()
              settings.onClose()
            }}
            variant="secondary"
          >
            <Settings /> Настройки аккаунта
          </Button>
          <div
            onClick={() => {
              router.push(pages.ROOT)
              settings.onClose()
            }}
          >
            <SignOutButton>
              <Button
                variant="secondary"
                className="w-full bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-950"
              >
                <LogOut /> Выйти
              </Button>
            </SignOutButton>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

