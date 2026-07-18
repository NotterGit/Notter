import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { ModeToggle } from "../mode-toggle"
import { useSettings } from "../hooks/use-settings"
import { Label } from "../ui/label"
import { Separator } from "@radix-ui/react-dropdown-menu"
import { SignOutButton, useOrganization, useClerk, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { getById as getUserById } from "../../app/api/users/user"
import { getById as getOrgById } from "../../app/api/orgs/org"
import { updateUser } from "../../app/api/users/user"
import { updateOrg } from "../../app/api/orgs/org"
import { pages } from "@/config/routing/pages.route"
import { Button } from "../ui/button"
import { useRef } from "react"
import { LogOut, Settings, User } from "lucide-react"
import { isDesktopApp } from "@/lib/desktop-app"

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
  const [isPrivated, setIsPrivated] = useState<boolean>(false)
  const [watermark, setWatermark] = useState<boolean>(false)
  const [redirect, setRedirect] = useState<boolean>(false)
  const [isDesktop, setIsDesktop] = useState<boolean>(false)
  const [userData, setUserData] = useState<any>(null)
  const isOrg = organization?.id !== undefined
  const id = isOrg ? organization?.id : user?.id as string

  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
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
  }, [user, id, isOrg])

  const handlePrivacyToggle = async (value: boolean) => {
    setIsPrivated(value)

    if (id) {
      if (isOrg) {
        await updateOrg(id, null, null, null, null, value)
      } else {
        await updateUser(id, null, null, null, null, value)
      }

      return null
    }
  }

  const handleWatermarkToggle = async (value: boolean) => {
    setWatermark(value)

    if (id) {
      if (isOrg) {
        await updateOrg(id, null, null, null, null, null, null, null, null, null, value)
      } else {
        await updateUser(id, null, null, null, null, null, null, null, null, null, value)
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

        {(userData?.owner === user?.id || !isOrg) && (
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

        {(userData?.premium === 2 && userData?.owner === user?.id || !isOrg) && (
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
      </DialogContent>
    </Dialog>
  )
}
